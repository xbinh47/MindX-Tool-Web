import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { sheet, lesson, data: lessonData } = await request.json()

    if (!sheet || !lesson || !lessonData) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400 })
    }

    // Read current data
    const dataPath = path.join(process.cwd(), 'src', 'data', 'data.json')
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const jsonData = JSON.parse(fileContent)

    // Update the specific lesson data
    if (jsonData[sheet] && jsonData[sheet][lesson]) {
      // Preserve homework_result, deadline, and student_book from existing data
      // (student_book is now managed separately in student-books.json)
      const existingData = jsonData[sheet][lesson]
      jsonData[sheet][lesson] = {
        ...lessonData,
        homework_result: existingData.homework_result || "",
        deadline: existingData.deadline || "",
        student_book: existingData.student_book || "", // Keep existing student_book in lesson data for backward compatibility
      }

      // Write back to file
      fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2), 'utf-8')

      return NextResponse.json({ success: true, message: 'Đã lưu thành công' })
    } else {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài học' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu dữ liệu' }, { status: 500 })
  }
}

