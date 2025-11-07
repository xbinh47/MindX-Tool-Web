"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronUp, ChevronDown } from "lucide-react"
import data from "@/data/data.json"

interface LessonData {
  lesson_content: string
  student_book: string
  next_lesson_content: string
  video: string
  homework_result: string
  deadline: string
  next_requirement: string
}

export default function Home() {
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [selectedLesson, setSelectedLesson] = useState<string>("")
  const [lessonNumber, setLessonNumber] = useState<number>(1)
  const [formData, setFormData] = useState<LessonData>({
    lesson_content: "",
    student_book: "",
    next_lesson_content: "",
    video: "",
    homework_result: "",
    deadline: "",
    next_requirement: "",
  })
  const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>({
    lesson_content: false,
    student_book: false,
    next_lesson_content: false,
    video: false,
    homework_result: false,
    deadline: false,
    next_requirement: false,
  })
  const [result, setResult] = useState<string>("")

  const sheets = Object.keys(data)

  // Update selectedLesson when sheet or lessonNumber changes
  useEffect(() => {
    if (selectedSheet && lessonNumber) {
      const lessonKey = `lesson_${lessonNumber}`
      setSelectedLesson(lessonKey)
    }
  }, [selectedSheet, lessonNumber])

  // Load lesson data when selectedSheet and selectedLesson change
  useEffect(() => {
    if (selectedSheet && selectedLesson) {
      const sheetData = data[selectedSheet as keyof typeof data]
      const lessonData = sheetData?.[selectedLesson as keyof typeof sheetData] as LessonData | undefined
      if (lessonData) {
        setFormData(lessonData)
      } else {
        // Reset form if lesson doesn't exist
        setFormData({
          lesson_content: "",
          student_book: "",
          next_lesson_content: "",
          video: "",
          homework_result: "",
          deadline: "",
          next_requirement: "",
        })
      }
    }
  }, [selectedSheet, selectedLesson])

  const handleFieldChange = (field: keyof LessonData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCheckedFields((prev) => ({ ...prev, [field]: checked }))
  }

  const handleLessonNumberChange = (delta: number) => {
    const newNumber = Math.max(1, lessonNumber + delta)
    setLessonNumber(newNumber)
  }

  const generateContent = () => {
    const output: Record<string, any> = {}
    if (selectedSheet) {
      output[selectedSheet] = {}
      output[selectedSheet][selectedLesson] = formData
    }
    setResult(JSON.stringify(output, null, 2))
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Quản Lý Bài Học</h1>
      </div>

      {/* Sheet and Lesson Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sheet">Tên sheet:</Label>
          <Select value={selectedSheet} onValueChange={setSelectedSheet}>
            <SelectTrigger id="sheet" className="w-full">
              <SelectValue placeholder="Chọn sheet" />
            </SelectTrigger>
            <SelectContent>
              {sheets.map((sheet) => (
                <SelectItem key={sheet} value={sheet}>
                  {sheet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lessonNumber">Số bài học:</Label>
          <div className="flex items-center gap-2">
            <Input
              id="lessonNumber"
              type="number"
              min="1"
              value={lessonNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 1
                setLessonNumber(num)
                if (selectedSheet) {
                  setSelectedLesson(`lesson_${num}`)
                }
              }}
              className="flex-1"
            />
            <div className="flex flex-col">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-4 w-8 rounded-b-none"
                onClick={() => handleLessonNumberChange(1)}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-4 w-8 rounded-t-none border-t-0"
                onClick={() => handleLessonNumberChange(-1)}
              >
                <ChevronDown className="h-3 w-3" />
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields with Checkboxes */}
      <div className="space-y-4">
        {/* Nội dung buổi học */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="lesson_content"
              checked={checkedFields.lesson_content}
              onCheckedChange={(checked) => handleCheckboxChange("lesson_content", checked as boolean)}
            />
            <Label htmlFor="lesson_content" className="cursor-pointer">
              Nội dung buổi học:
            </Label>
          </div>
          <Textarea
            id="lesson_content"
            value={formData.lesson_content}
            onChange={(e) => handleFieldChange("lesson_content", e.target.value)}
            placeholder="Nhập nội dung buổi học..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Tình hình học tập của lớp */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="student_book"
              checked={checkedFields.student_book}
              onCheckedChange={(checked) => handleCheckboxChange("student_book", checked as boolean)}
            />
            <Label htmlFor="student_book" className="cursor-pointer">
              Tình hình học tập của lớp:
            </Label>
          </div>
          <Textarea
            id="student_book"
            value={formData.student_book}
            onChange={(e) => handleFieldChange("student_book", e.target.value)}
            placeholder="Nhập tình hình học tập của lớp..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Link slide - Note: This field doesn't exist in JSON, using video field */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="slide"
              checked={checkedFields.slide}
              onCheckedChange={(checked) => handleCheckboxChange("slide", checked as boolean)}
            />
            <Label htmlFor="slide" className="cursor-pointer">
              Link slide:
            </Label>
          </div>
          <Input
            id="slide"
            type="url"
            value=""
            onChange={() => {}}
            placeholder="Nhập link slide..."
          />
        </div>

        {/* Link video */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="video"
              checked={checkedFields.video}
              onCheckedChange={(checked) => handleCheckboxChange("video", checked as boolean)}
            />
            <Label htmlFor="video" className="cursor-pointer">
              Link video:
            </Label>
          </div>
          <Input
            id="video"
            type="url"
            value={formData.video}
            onChange={(e) => handleFieldChange("video", e.target.value)}
            placeholder="Nhập link video..."
          />
        </div>

        {/* Kết quả bài tập về nhà */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="homework_result"
              checked={checkedFields.homework_result}
              onCheckedChange={(checked) => handleCheckboxChange("homework_result", checked as boolean)}
            />
            <Label htmlFor="homework_result" className="cursor-pointer">
              Kết quả bài tập về nhà:
            </Label>
          </div>
          <Textarea
            id="homework_result"
            value={formData.homework_result}
            onChange={(e) => handleFieldChange("homework_result", e.target.value)}
            placeholder="Nhập kết quả bài tập về nhà..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Yêu cầu cho buổi tiếp theo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="next_requirement"
              checked={checkedFields.next_requirement}
              onCheckedChange={(checked) => handleCheckboxChange("next_requirement", checked as boolean)}
            />
            <Label htmlFor="next_requirement" className="cursor-pointer">
              Yêu cầu cho buổi tiếp theo:
            </Label>
          </div>
          <Textarea
            id="next_requirement"
            value={formData.next_requirement}
            onChange={(e) => handleFieldChange("next_requirement", e.target.value)}
            placeholder="Nhập yêu cầu cho buổi tiếp theo..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Hạn nộp bài */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="deadline"
              checked={checkedFields.deadline}
              onCheckedChange={(checked) => handleCheckboxChange("deadline", checked as boolean)}
            />
            <Label htmlFor="deadline" className="cursor-pointer">
              Hạn nộp bài:
            </Label>
          </div>
          <Textarea
            id="deadline"
            value={formData.deadline}
            onChange={(e) => handleFieldChange("deadline", e.target.value)}
            placeholder="Nhập hạn nộp bài..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Nội dung buổi tới */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="next_lesson_content"
              checked={checkedFields.next_lesson_content}
              onCheckedChange={(checked) => handleCheckboxChange("next_lesson_content", checked as boolean)}
            />
            <Label htmlFor="next_lesson_content" className="cursor-pointer">
              Nội dung buổi tới:
            </Label>
          </div>
          <Textarea
            id="next_lesson_content"
            value={formData.next_lesson_content}
            onChange={(e) => handleFieldChange("next_lesson_content", e.target.value)}
            placeholder="Nhập nội dung buổi tới..."
            rows={3}
            className="resize-none"
          />
                  </div>
                </div>

      {/* Create Content Button */}
      <div className="flex justify-center">
        <Button onClick={generateContent} size="lg" className="w-full md:w-auto">
          Tạo nội dung
                  </Button>
                </div>

      {/* Result Section */}
      {result && (
        <div className="space-y-2">
          <Label>Kết quả:</Label>
          <Textarea
            value={result}
            readOnly
            rows={15}
            className="resize-none font-mono text-sm"
          />
        </div>
      )}

      {/* Copyright */}
      <div className="text-right text-sm text-muted-foreground">
        © Xuân Bình
      </div>
    </div>
  )
}
