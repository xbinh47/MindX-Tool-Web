"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import data from "@/data/data.json"
import studentBooks from "@/data/student-books.json"

interface LessonData {
  lesson_content: string
  next_lesson_content: string
  video: string
  next_requirement: string
}

export default function AdminPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [selectedLesson, setSelectedLesson] = useState<string>("")
  const [lessonNumber, setLessonNumber] = useState<number>(1)
  const [formData, setFormData] = useState<LessonData>({
    lesson_content: "",
    next_lesson_content: "",
    video: "",
    next_requirement: "",
  })
  const [studentBook, setStudentBook] = useState<string>("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [studentBookSaveStatus, setStudentBookSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")

  const sheets = Object.keys(data)

  useEffect(() => {
    setMounted(true)
    // Check if already authenticated
    const auth = sessionStorage.getItem("admin_authenticated")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
    // Ensure theme is set to light if not available
    if (!theme && setTheme) {
      setTheme("light")
    }
  }, [theme, setTheme])

  // Sync currentTheme with theme from useTheme
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme as "light" | "dark")
    } else {
      setCurrentTheme("light")
    }
  }, [theme])

  // Apply theme class to HTML element
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(currentTheme)
      root.setAttribute("data-theme", currentTheme)
    }
  }, [currentTheme, mounted])

  // Update selectedLesson when sheet or lessonNumber changes
  useEffect(() => {
    if (selectedSheet && lessonNumber) {
      const lessonKey = `lesson_${lessonNumber}`
      setSelectedLesson(lessonKey)
    }
  }, [selectedSheet, lessonNumber])

  // Load student book when selectedSheet changes
  useEffect(() => {
    if (selectedSheet && isAuthenticated) {
      const book = (studentBooks as Record<string, string>)[selectedSheet] || ""
      setStudentBook(book)
    }
  }, [selectedSheet, isAuthenticated])

  // Load lesson data when selectedSheet and selectedLesson change
  useEffect(() => {
    if (selectedSheet && selectedLesson && isAuthenticated) {
      const sheetData = data[selectedSheet as keyof typeof data]
      const lessonData = sheetData?.[selectedLesson as keyof typeof sheetData] as any
      if (lessonData) {
        setFormData({
          lesson_content: lessonData.lesson_content || "",
          next_lesson_content: lessonData.next_lesson_content || "",
          video: lessonData.video || "",
          next_requirement: lessonData.next_requirement || "",
        })
      }
    }
  }, [selectedSheet, selectedLesson, isAuthenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (result.success) {
        setIsAuthenticated(true)
        sessionStorage.setItem("admin_authenticated", "true")
      } else {
        setError(result.error || "Mật khẩu không đúng")
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: keyof LessonData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!selectedSheet || !selectedLesson) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
      return
    }

    setSaveStatus("saving")
    
    try {
      const response = await fetch("/api/save-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheet: selectedSheet,
          lesson: selectedLesson,
          data: formData,
        }),
      })

      if (response.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 2000)
      }
    } catch (err) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const handleSaveStudentBook = async () => {
    if (!selectedSheet) {
      setStudentBookSaveStatus("error")
      setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
      return
    }

    setStudentBookSaveStatus("saving")
    
    try {
      const response = await fetch("/api/save-student-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheet: selectedSheet,
          studentBook: studentBook,
        }),
      })

      if (response.ok) {
        setStudentBookSaveStatus("success")
        setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
      } else {
        setStudentBookSaveStatus("error")
        setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
      }
    } catch (err) {
      setStudentBookSaveStatus("error")
      setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
    }
  }

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

  if (!mounted) {
    return null
  }

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Đăng Nhập Admin</CardTitle>
            <CardDescription>Nhập mật khẩu để truy cập trang quản trị</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  autoFocus
                />
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang xác thực..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản Trị Hệ Thống</h1>
          <p className="text-muted-foreground mt-1">Chỉnh sửa dữ liệu bài học</p>
        </div>
        <div className="flex items-center gap-4">
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
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem("admin_authenticated")
              setIsAuthenticated(false)
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Selection and Student Book */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chọn Sheet và Bài Học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Student Book Card */}
            {selectedSheet && (
              <Card>
                <CardHeader>
                  <CardTitle>Student Book (Toàn khóa học)</CardTitle>
                  <CardDescription>Student Book áp dụng cho toàn bộ khóa học {selectedSheet}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_book">Link Student Book:</Label>
                    <Input
                      id="student_book"
                      type="url"
                      value={studentBook}
                      onChange={(e) => setStudentBook(e.target.value)}
                      placeholder="Nhập link Student Book..."
                    />
                  </div>
                  <Button
                    onClick={handleSaveStudentBook}
                    className="w-full"
                    disabled={studentBookSaveStatus === "saving"}
                  >
                    {studentBookSaveStatus === "saving" ? "Đang lưu..." : studentBookSaveStatus === "success" ? "Đã lưu!" : studentBookSaveStatus === "error" ? "Lỗi!" : "Lưu Student Book"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Edit Form */}
          {selectedSheet && selectedLesson && (
            <Card>
              <CardHeader>
                <CardTitle>Chỉnh Sửa Dữ Liệu</CardTitle>
                <CardDescription>Chỉnh sửa thông tin bài học</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson_content">Nội dung buổi học:</Label>
                  <Textarea
                    id="lesson_content"
                    value={formData.lesson_content}
                    onChange={(e) => handleFieldChange("lesson_content", e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video">Link video:</Label>
                  <Input
                    id="video"
                    type="url"
                    value={formData.video}
                    onChange={(e) => handleFieldChange("video", e.target.value)}
                    placeholder="Link video..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_requirement">Yêu cầu cho buổi tiếp theo:</Label>
                  <Textarea
                    id="next_requirement"
                    value={formData.next_requirement}
                    onChange={(e) => handleFieldChange("next_requirement", e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_lesson_content">Nội dung buổi tới:</Label>
                  <Textarea
                    id="next_lesson_content"
                    value={formData.next_lesson_content}
                    onChange={(e) => handleFieldChange("next_lesson_content", e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "success" ? "Đã lưu!" : saveStatus === "error" ? "Lỗi!" : "Lưu thay đổi"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
