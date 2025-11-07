"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronUp, ChevronDown, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import data from "@/data/data.json"
import studentBooks from "@/data/student-books.json"

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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light")
  
  // Sync currentTheme with theme from useTheme
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme as "light" | "dark")
    } else {
      setCurrentTheme("light")
    }
  }, [theme])
  
  // Handle theme toggle
  const toggleTheme = () => {
    if (!setTheme) {
      console.error("setTheme is not available")
      return
    }
    try {
      const newTheme = currentTheme === "light" ? "dark" : "light"
      console.log("Toggling theme from", currentTheme, "to", newTheme)
      
      // Update local state immediately for icon
      setCurrentTheme(newTheme)
      
      // Apply immediately to HTML element
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(newTheme)
      root.setAttribute("data-theme", newTheme)
      
      // Then update theme state
      setTheme(newTheme)
      
      console.log("Theme toggled. HTML classes:", root.className)
    } catch (error) {
      console.error("Error toggling theme:", error)
    }
  }
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
  const [greeting, setGreeting] = useState<string>("Chào cả lớp, Thầy gửi nội dung buổi học vừa qua")
  const [result, setResult] = useState<string>("")

  const sheets = Object.keys(data)

  // Handle mounting for theme
  useEffect(() => {
    setMounted(true)
    // Ensure theme is set to light if not available
    if (!theme && setTheme) {
      setTheme("light")
    }
  }, [theme, setTheme])

  // Apply theme class to HTML element - ensure it's applied
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      const currentTheme = theme || "light"
      
      // Remove all theme classes
      root.classList.remove("light", "dark")
      
      // Add current theme class
      root.classList.add(currentTheme)
      
      // Also set data-theme attribute
      root.setAttribute("data-theme", currentTheme)
      
      console.log("Applied theme class:", currentTheme, "to HTML element. Current classes:", root.className)
    }
  }, [theme, mounted])

  // Load checkedFields from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("checkedFields")
    if (saved) {
      try {
        setCheckedFields(JSON.parse(saved))
      } catch (e) {
        console.error("Error loading checkedFields from localStorage", e)
      }
    }
  }, [])

  // Load greeting from localStorage on mount
  useEffect(() => {
    if (mounted) {
      const saved = localStorage.getItem("greeting")
      if (saved) {
        setGreeting(saved)
      }
    }
  }, [mounted])

  // Save greeting to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("greeting", greeting)
    }
  }, [greeting, mounted])

  // Save checkedFields to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("checkedFields", JSON.stringify(checkedFields))
  }, [checkedFields])

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
      const lessonData = sheetData?.[selectedLesson as keyof typeof sheetData] as any
      const studentBook = (studentBooks as Record<string, string>)[selectedSheet] || ""
      if (lessonData) {
        // Map data correctly to form fields
        setFormData({
          lesson_content: lessonData.lesson_content || "",
          student_book: studentBook,
          next_lesson_content: lessonData.next_lesson_content || "",
          video: lessonData.video || "",
          homework_result: lessonData.homework_result || "",
          deadline: lessonData.deadline || "",
          next_requirement: lessonData.next_requirement || "",
        })
      } else {
        // Reset form if lesson doesn't exist
        setFormData({
          lesson_content: "",
          student_book: studentBook,
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
    let content = ""
    
    if (!selectedSheet || !selectedLesson) {
      setResult("Vui lòng chọn Sheet và Bài học trước khi tạo nội dung.")
      return
    }

    // Greeting
    if (greeting.trim()) {
      content += `${greeting}\n`
    }

    // Header
    content += `**📌 Nội dung buổi học số ${lessonNumber}**\n`

    // Nội dung buổi học
    if (formData.lesson_content.trim()) {
      content += `${formData.lesson_content}\n`
    }

    // Student Book
    if (formData.student_book.trim()) {
      content += `**📚 Student Book:**\n${formData.student_book}\n`
    }

    // Link video
    if (formData.video.trim()) {
      content += `**🎥 Link video:**\n${formData.video}\n`
    }

    // Kết quả bài tập về nhà
    if (formData.homework_result.trim()) {
      content += `**✅ Kết quả bài tập về nhà:**\n${formData.homework_result}\n`
    }

    // Yêu cầu cho buổi tiếp theo
    if (formData.next_requirement.trim()) {
      content += `**📋 Yêu cầu cho buổi tiếp theo:**\n${formData.next_requirement}\n`
    }

    // Hạn nộp bài
    if (formData.deadline.trim()) {
      content += `**⏰ Hạn nộp bài:**\n${formData.deadline}\n`
    }

    // Nội dung buổi tới
    if (formData.next_lesson_content.trim()) {
      content += `**📖 Nội dung buổi tới:**\n${formData.next_lesson_content}\n`
    }

    // Tình hình học tập của lớp (nếu có)
    // Note: This field is currently empty in the form, but we can add it if needed

    setResult(content.trim())
  }

  return (
    <div className="min-h-screen p-6 bg-background relative pb-20">
      {/* Header with Theme Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1"></div>
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold">Quản Lý Bài Học</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleTheme()
            }}
            className="rounded-full cursor-pointer"
            type="button"
            aria-label="Toggle theme"
          >
            {currentTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          {/* Greeting Editor */}
          <div className="space-y-2">
            <Label htmlFor="greeting">Lời chào:</Label>
            <Input
              id="greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Nhập lời chào..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lời chào sẽ được thêm vào đầu nội dung. Lưu tự động vào localStorage.
            </p>
          </div>

          {/* Sheet and Lesson Selection */}
          <div className="space-y-4">
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
              <Select
                value={lessonNumber.toString()}
                onValueChange={(value) => {
                  const num = parseInt(value) || 1
                  setLessonNumber(num)
                  if (selectedSheet) {
                    setSelectedLesson(`lesson_${num}`)
                  }
                }}
              >
                <SelectTrigger id="lessonNumber" className="w-full">
                  <SelectValue placeholder="Chọn bài học" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSheet && (() => {
                    const sheetData = data[selectedSheet as keyof typeof data]
                    const lessons = sheetData ? Object.keys(sheetData).filter(key => key.startsWith('lesson_')) : []
                    return lessons.map((lesson) => {
                      const num = parseInt(lesson.replace('lesson_', '')) || 1
                      return (
                        <SelectItem key={lesson} value={num.toString()}>
                          Bài {num}
                        </SelectItem>
                      )
                    })
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Fields with Checkboxes */}
          <div className="space-y-4">
            {/* Nội dung buổi học - Always visible */}
            <div className="space-y-2">
              <Label htmlFor="lesson_content">Nội dung buổi học:</Label>
              <Textarea
                id="lesson_content"
                value={formData.lesson_content}
                onChange={(e) => handleFieldChange("lesson_content", e.target.value)}
                placeholder="Nhập nội dung buổi học..."
                rows={4}
                className="resize-none"
              />
        </div>

            {/* Tình hình học tập của lớp - Always visible, but student_book in JSON is actually slide link */}
            <div className="space-y-2">
              <Label htmlFor="class_situation">Tình hình học tập của lớp:</Label>
              <Textarea
                id="class_situation"
                value=""
                onChange={() => {}}
                placeholder="Nhập tình hình học tập của lớp..."
                rows={4}
                className="resize-none"
            />
          </div>

            {/* Student Book - Hidden by default, uses student_book from JSON */}
            {checkedFields.slide && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="slide"
                    checked={checkedFields.slide}
                    onCheckedChange={(checked) => handleCheckboxChange("slide", checked as boolean)}
                  />
                  <Label htmlFor="slide" className="cursor-pointer">
                    Student Book:
                  </Label>
          </div>
                <Input
                  id="slide"
                  type="url"
                  value={formData.student_book}
                  onChange={(e) => handleFieldChange("student_book", e.target.value)}
                  placeholder="Nhập Student Book..."
                />
        </div>
            )}

            {/* Link video - Hidden by default */}
            {checkedFields.video && (
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
            )}

            {/* Kết quả bài tập về nhà - Hidden by default */}
            {checkedFields.homework_result && (
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
            )}

            {/* Yêu cầu cho buổi tiếp theo - Hidden by default */}
            {checkedFields.next_requirement && (
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
            )}

            {/* Hạn nộp bài - Hidden by default */}
            {checkedFields.deadline && (
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
            )}

            {/* Nội dung buổi tới - Hidden by default */}
            {checkedFields.next_lesson_content && (
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
            )}
              </div>

          {/* Checkbox buttons to show hidden fields */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-medium">Thêm các trường khác:</Label>
            <div className="flex flex-wrap gap-3">
              {!checkedFields.slide && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckboxChange("slide", true)}
                >
                  + Student Book
                </Button>
              )}
              {!checkedFields.video && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckboxChange("video", true)}
                >
                  + Link video
                </Button>
              )}
              {!checkedFields.homework_result && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckboxChange("homework_result", true)}
                >
                  + Kết quả bài tập về nhà
                </Button>
              )}
              {!checkedFields.next_requirement && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckboxChange("next_requirement", true)}
                >
                  + Yêu cầu cho buổi tiếp theo
                </Button>
              )}
              {!checkedFields.deadline && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckboxChange("deadline", true)}
                >
                  + Hạn nộp bài
                </Button>
              )}
              {!checkedFields.next_lesson_content && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckboxChange("next_lesson_content", true)}
                >
                  + Nội dung buổi tới
                </Button>
              )}
            </div>
          </div>

          {/* Create Content Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={generateContent} size="lg" className="w-full">
              Tạo nội dung
                </Button>
              </div>
        </div>

        {/* Right Column - Result Display */}
        <div className="space-y-4">
          <div className="sticky top-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Kết quả (có thể copy với format):</Label>
              {result ? (
                <div className="space-y-2">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      // Convert HTML back to markdown when editing
                      const html = e.currentTarget.innerHTML
                      const text = html.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                        .replace(/<b>(.*?)<\/b>/g, '**$1**')
                        .replace(/<br\s*\/?>/g, '\n')
                        .replace(/&nbsp;/g, ' ')
                      setResult(text)
                    }}
                    className="border rounded-md p-4 text-sm bg-background whitespace-pre-wrap min-h-[400px] focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                    dangerouslySetInnerHTML={{
                      __html: result
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br>')
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const htmlContent = result
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br>')
                        const blob = new Blob([htmlContent], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'noi-dung-bai-hoc.html'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      Copy HTML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const htmlContent = result
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br>')
                        await navigator.clipboard.write([
                          new ClipboardItem({
                            'text/html': new Blob([htmlContent], { type: 'text/html' }),
                            'text/plain': new Blob([result], { type: 'text/plain' })
                          })
                        ])
                        alert('Đã copy vào clipboard với format! Paste vào Word hoặc email để thấy chữ in đậm.')
                      }}
                    >
                      Copy với format
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center text-muted-foreground bg-muted/50 min-h-[400px] flex items-center justify-center">
                  <p>Kết quả sẽ hiển thị ở đây sau khi nhấn "Tạo nội dung"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright - Fixed at bottom */}
      <div className="fixed bottom-4 right-4 text-sm text-muted-foreground">
        © Xuân Bình
      </div>
    </div>
  )
}
