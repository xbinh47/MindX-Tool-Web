import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { sheet, studentBook } = await request.json()

    if (!sheet) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin sheet' }, { status: 400 })
    }

    // Read current student books data
    const dataPath = path.join(process.cwd(), 'src', 'data', 'student-books.json')
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const jsonData = JSON.parse(fileContent)

    // Update the student book for the sheet
    jsonData[sheet] = studentBook || ""

    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2), 'utf-8')

    return NextResponse.json({ success: true, message: 'Đã lưu Student Book thành công' })
  } catch (error) {
    console.error('Error saving student book:', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu Student Book' }, { status: 500 })
  }
}

