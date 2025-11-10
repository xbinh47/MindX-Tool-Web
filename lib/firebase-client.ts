import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore'

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
const STUDENT_BOOKS_COLLECTION = 'studentBooks'

export async function getAllSubjects() {
  const db = getFirestoreClient()
  const subjectsSnapshot = await getDocs(collection(db, SUBJECTS_COLLECTION))
  const studentBooksSnapshot = await getDocs(collection(db, STUDENT_BOOKS_COLLECTION))
  
  // Cấu trúc: { [subjectCode]: { [levelCode]: { [lessonKey]: LessonData } } }
  const subjectsMap: Record<string, Record<string, Record<string, any>>> = {}
  const studentBooksMap: Record<string, string> = {}
  const subjectNamesMap: Record<string, string> = {}

  // Load student books
  studentBooksSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const levelCode = docSnapshot.id
    const studentBook = data.student_book || ''
    if (studentBook) {
      studentBooksMap[levelCode] = studentBook
    }
  })

  // Load subjects với cấu trúc Subject -> Level -> Lessons
  const subjectsWithOrder: Array<{ code: string; order: number; data: any }> = []
  
  subjectsSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const subjectCode = data.subject_code || docSnapshot.id
    const subjectName = data.subject_name || subjectCode
    const levels = data.levels || {}
    const displayOrder = data.display_order ?? 999999 // Default order nếu chưa có

    // Lưu tên subject
    subjectNamesMap[subjectCode] = subjectName

    if (!subjectsMap[subjectCode]) {
      subjectsMap[subjectCode] = {}
    }

    // Debug cho ROB
    if (subjectCode === 'ROB') {
      console.log('[DEBUG] ROB document data:', {
        subjectCode,
        subjectName,
        levelsKeys: Object.keys(levels),
        levelsCount: Object.keys(levels).length,
        levels: levels
      })
    }

    // Xử lý từng level với order
    const levelsWithOrder: Array<{ code: string; order: number; lessons: any }> = []
    Object.keys(levels).forEach((levelCode) => {
      const levelData = levels[levelCode]
      const lessons = levelData.lessons || {}
      const levelOrder = levelData.display_order ?? 999999
      
      levelsWithOrder.push({ code: levelCode, order: levelOrder, lessons })
      
      // Debug cho ROB levels
      if (subjectCode === 'ROB') {
        console.log(`[DEBUG] ROB level ${levelCode}:`, {
          levelCode,
          lessonsCount: Object.keys(lessons).length,
          lessonKeys: Object.keys(lessons).slice(0, 5) // Show first 5
        })
      }
    })

    // Sắp xếp levels theo display_order
    levelsWithOrder.sort((a, b) => a.order - b.order)
    
    // Lưu vào subjectsMap theo thứ tự đã sắp xếp
    levelsWithOrder.forEach(({ code, lessons }) => {
      subjectsMap[subjectCode][code] = lessons
    })

    subjectsWithOrder.push({ code: subjectCode, order: displayOrder, data: subjectsMap[subjectCode] })
  })

  // Sắp xếp subjects theo display_order
  subjectsWithOrder.sort((a, b) => a.order - b.order)
  
  // Tạo lại subjectsMap theo thứ tự đã sắp xếp
  const orderedSubjectsMap: Record<string, Record<string, Record<string, any>>> = {}
  subjectsWithOrder.forEach(({ code, data }) => {
    orderedSubjectsMap[code] = data
  })

  return {
    data: orderedSubjectsMap,
    studentBooks: studentBooksMap,
    subjectNames: subjectNamesMap,
  }
}

export async function saveLessonData(subjectCode: string, levelCode: string, lessonKey: string, lessonData: any) {
  const db = getFirestoreClient()
  
  // Lấy document của subject
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (!docSnapshot.exists()) {
    throw new Error('Không tìm thấy môn học')
  }

  // Lấy dữ liệu hiện tại
  const docData = docSnapshot.data()
  const levels = docData.levels || {}
  const levelData = levels[levelCode] || { lessons: {} }
  const lessons = levelData.lessons || {}
  const existingLessonData = lessons[lessonKey] || {}

  // Merge dữ liệu mới với dữ liệu cũ (giữ lại homework_result, deadline)
  const updatedLessonData = {
    ...lessonData,
    homework_result: existingLessonData.homework_result || lessonData.homework_result || "",
    deadline: existingLessonData.deadline || lessonData.deadline || "",
  }

  // Update lesson trong level
  const updatedLessons = {
    ...lessons,
    [lessonKey]: updatedLessonData,
  }

  // Cập nhật levels với lesson mới
  const updatedLevels = {
    ...levels,
    [levelCode]: {
      ...levelData,
      lessons: updatedLessons,
    },
  }

  // Cập nhật document
  await updateDoc(docRef, {
    levels: updatedLevels,
    updated_at: new Date(),
  })
}

export async function saveStudentBook(levelCode: string, studentBook: string) {
  const db = getFirestoreClient()
  
  // Lưu student book vào collection studentBooks
  const docRef = doc(db, STUDENT_BOOKS_COLLECTION, levelCode)
  await updateDoc(docRef, {
    student_book: studentBook || "",
    updated_at: new Date(),
  })
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

export async function createSubject(subjectCode: string, subjectName: string) {
  const db = getFirestoreClient()
  
  // Kiểm tra xem subject đã tồn tại chưa
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (docSnapshot.exists()) {
    throw new Error('Khóa học đã tồn tại')
  }

  // Lấy số lượng subjects hiện tại để set display_order
  const allSubjectsSnapshot = await getDocs(collection(db, SUBJECTS_COLLECTION))
  const maxOrder = allSubjectsSnapshot.docs.reduce((max, doc) => {
    const order = doc.data().display_order ?? 0
    return Math.max(max, order)
  }, -1)

  // Tạo subject mới với cấu trúc rỗng
  await setDoc(docRef, {
    subject_code: subjectCode,
    subject_name: subjectName,
    levels: {},
    display_order: maxOrder + 1,
    created_at: new Date(),
    updated_at: new Date(),
  })
}

export async function updateSubjectName(subjectCode: string, newSubjectName: string) {
  const db = getFirestoreClient()
  
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (!docSnapshot.exists()) {
    throw new Error('Không tìm thấy khóa học')
  }

  await updateDoc(docRef, {
    subject_name: newSubjectName,
    updated_at: new Date(),
  })
}

export async function createLevel(subjectCode: string, levelCode: string) {
  const db = getFirestoreClient()
  
  // Kiểm tra xem subject có tồn tại không
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (!docSnapshot.exists()) {
    throw new Error('Không tìm thấy khóa học')
  }

  // Lấy dữ liệu hiện tại
  const docData = docSnapshot.data()
  const levels = docData.levels || {}
  
  // Kiểm tra xem level đã tồn tại chưa
  if (levels[levelCode]) {
    throw new Error('Level đã tồn tại')
  }

  // Tính toán display_order mới (lấy max order hiện tại + 1)
  const existingOrders = Object.values(levels).map((level: any) => level.display_order ?? 0)
  const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : -1

  // Thêm level mới với cấu trúc rỗng
  const updatedLevels = {
    ...levels,
    [levelCode]: {
      lessons: {},
      display_order: maxOrder + 1,
    },
  }

  await updateDoc(docRef, {
    levels: updatedLevels,
    updated_at: new Date(),
  })

  // Tạo document rỗng trong studentBooks collection
  const studentBookRef = doc(db, STUDENT_BOOKS_COLLECTION, levelCode)
  await setDoc(studentBookRef, {
    student_book: "",
    created_at: new Date(),
    updated_at: new Date(),
  })
}

export async function deleteLevel(subjectCode: string, levelCode: string) {
  const db = getFirestoreClient()
  
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (!docSnapshot.exists()) {
    throw new Error('Không tìm thấy khóa học')
  }

  // Lấy dữ liệu hiện tại
  const docData = docSnapshot.data()
  const levels = docData.levels || {}
  
  // Kiểm tra xem level có tồn tại không
  if (!levels[levelCode]) {
    throw new Error('Không tìm thấy level')
  }

  // Xóa level
  const updatedLevels = { ...levels }
  delete updatedLevels[levelCode]

  await updateDoc(docRef, {
    levels: updatedLevels,
    updated_at: new Date(),
  })

  // Xóa student book của level
  const studentBookRef = doc(db, STUDENT_BOOKS_COLLECTION, levelCode)
  const studentBookSnapshot = await getDoc(studentBookRef)
  if (studentBookSnapshot.exists()) {
    await deleteDoc(studentBookRef)
  }
}

export async function updateSubjectOrder(subjectCode: string, newOrder: number) {
  const db = getFirestoreClient()
  
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (!docSnapshot.exists()) {
    throw new Error('Không tìm thấy khóa học')
  }

  await updateDoc(docRef, {
    display_order: newOrder,
    updated_at: new Date(),
  })
}

export async function updateLevelOrder(subjectCode: string, levelCode: string, newOrder: number) {
  const db = getFirestoreClient()
  
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectCode)
  const docSnapshot = await getDoc(docRef)
  
  if (!docSnapshot.exists()) {
    throw new Error('Không tìm thấy khóa học')
  }

  const docData = docSnapshot.data()
  const levels = docData.levels || {}
  
  if (!levels[levelCode]) {
    throw new Error('Không tìm thấy level')
  }

  // Cập nhật display_order cho level
  const updatedLevels = {
    ...levels,
    [levelCode]: {
      ...levels[levelCode],
      display_order: newOrder,
    },
  }

  await updateDoc(docRef, {
    levels: updatedLevels,
    updated_at: new Date(),
  })
}

