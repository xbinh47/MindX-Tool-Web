import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'

let app: FirebaseApp | undefined
let db: Firestore | undefined

// Khởi tạo Firebase Client SDK
function initializeFirebaseClient(): { app: FirebaseApp; db: Firestore } {
  if (app && db) {
    return { app, db }
  }

  // Kiểm tra xem đã khởi tạo chưa
  const existingApps = getApps()
  if (existingApps.length > 0) {
    app = existingApps[0]
    db = getFirestore(app)
    return { app, db }
  }

  // Lấy config từ environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Kiểm tra các biến môi trường cần thiết
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Firebase client config is missing. ' +
      'Please set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file.'
    )
  }

  // Khởi tạo Firebase
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)

  return { app, db }
}

// Export functions để sử dụng
export function getFirebaseClient() {
  return initializeFirebaseClient()
}

export function getFirestoreClient(): Firestore {
  if (!db) {
    const { db: firestoreDb } = initializeFirebaseClient()
    return firestoreDb
  }
  return db
}

// Helper functions để fetch data
const SUBJECTS_COLLECTION = 'subjects'

export async function getAllSubjects() {
  const db = getFirestoreClient()
  const snapshot = await getDocs(collection(db, SUBJECTS_COLLECTION))
  
  if (snapshot.empty) {
    return { data: {}, studentBooks: {} }
  }

  // Group subjects theo original_subject_code
  const subjectsMap: Record<string, any> = {}
  const studentBooksMap: Record<string, string> = {}

  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const originalCode = data.original_subject_code || data.subject_code
    const subjectNumber = data.subject_number || 1
    const lessons = data.lessons || {}
    const studentBook = data.student_book || ''

    // Lưu student book (chỉ lấy từ subject đầu tiên hoặc không có số)
    if (!studentBooksMap[originalCode] || subjectNumber === 1) {
      studentBooksMap[originalCode] = studentBook
    }

    // Merge lessons vào subject gốc
    if (!subjectsMap[originalCode]) {
      subjectsMap[originalCode] = {}
    }

    // Thêm tất cả lessons vào subject
    Object.keys(lessons).forEach((lessonKey) => {
      subjectsMap[originalCode][lessonKey] = lessons[lessonKey]
    })
  })

  return {
    data: subjectsMap,
    studentBooks: studentBooksMap,
  }
}

export async function saveLessonData(subjectCode: string, lessonKey: string, lessonData: any) {
  const db = getFirestoreClient()
  
  // Tìm document chứa lesson này
  const q = query(collection(db, SUBJECTS_COLLECTION), where('original_subject_code', '==', subjectCode))
  const snapshot = await getDocs(q)
  
  let foundDoc: any = null

  // Tìm document có chứa lesson này
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data()
    const lessons = data.lessons || {}
    if (lessons[lessonKey]) {
      foundDoc = docSnapshot
      break
    }
  }

  // Nếu không tìm thấy, thử tìm theo subject_code chính xác
  if (!foundDoc) {
    const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
    const docSnapshot = await getDoc(docRef)
    if (docSnapshot.exists()) {
      const data = docSnapshot.data()
      const lessons = data.lessons || {}
      if (lessons[lessonKey]) {
        foundDoc = docSnapshot
      }
    }
  }

  if (!foundDoc) {
    throw new Error('Không tìm thấy bài học')
  }

  // Lấy dữ liệu hiện tại
  const docData = foundDoc.data()
  const lessons = docData.lessons || {}
  const existingLessonData = lessons[lessonKey] || {}

  // Merge dữ liệu mới với dữ liệu cũ (giữ lại homework_result, deadline)
  const updatedLessonData = {
    ...lessonData,
    homework_result: existingLessonData.homework_result || lessonData.homework_result || "",
    deadline: existingLessonData.deadline || lessonData.deadline || "",
  }

  // Update lesson trong document
  const updatedLessons = {
    ...lessons,
    [lessonKey]: updatedLessonData,
  }

  // Cập nhật document
  await updateDoc(foundDoc.ref, {
    lessons: updatedLessons,
    updated_at: new Date(),
  })
}

export async function saveStudentBook(subjectCode: string, studentBook: string) {
  const db = getFirestoreClient()
  
  // Tìm tất cả documents có original_subject_code khớp
  const q = query(collection(db, SUBJECTS_COLLECTION), where('original_subject_code', '==', subjectCode))
  const snapshot = await getDocs(q)

  // Nếu không tìm thấy, thử tìm theo subject_code chính xác
  if (snapshot.empty) {
    const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
    const docSnapshot = await getDoc(docRef)
    if (docSnapshot.exists()) {
      await updateDoc(docRef, {
        student_book: studentBook || "",
        updated_at: new Date(),
      })
      return
    } else {
      throw new Error('Không tìm thấy subject')
    }
  }

  // Update student_book cho tất cả documents của subject này
  const updatePromises = snapshot.docs.map((docSnapshot) => {
    return updateDoc(docSnapshot.ref, {
      student_book: studentBook || "",
      updated_at: new Date(),
    })
  })

  await Promise.all(updatePromises)
}

export async function deleteSubject(subjectCode: string) {
  const db = getFirestoreClient()
  
  // Tìm tất cả documents có original_subject_code khớp
  const q = query(collection(db, SUBJECTS_COLLECTION), where('original_subject_code', '==', subjectCode))
  const snapshot = await getDocs(q)

  // Nếu không tìm thấy, thử tìm theo subject_code chính xác
  if (snapshot.empty) {
    const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
    const docSnapshot = await getDoc(docRef)
    if (docSnapshot.exists()) {
      await deleteDoc(docRef)
      return
    } else {
      throw new Error('Không tìm thấy subject')
    }
  }

  // Xóa tất cả documents của subject này
  const deletePromises = snapshot.docs.map((docSnapshot) => {
    return deleteDoc(docSnapshot.ref)
  })

  await Promise.all(deletePromises)
}

