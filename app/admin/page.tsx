"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Moon, Sun, ChevronDown, ChevronRight, Trash2, BookOpen, Edit3 } from "lucide-react"
import { useTheme } from "next-themes"

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
  const [authLoading, setAuthLoading] = useState(false)
  
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
  const [data, setData] = useState<Record<string, any>>({})
  const [studentBooks, setStudentBooks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [selectedLessons, setSelectedLessons] = useState<string[]>([])
  const [deleteStatus, setDeleteStatus] = useState<Record<string, "idle" | "deleting" | "success" | "error">>({})
  const [activeTab, setActiveTab] = useState<string>("edit")

  const sheets = Object.keys(data)
  
  // Get all lessons for selected sheet
  const getLessonsForSheet = (sheet: string): string[] => {
    if (!sheet || !data[sheet]) return []
    return Object.keys(data[sheet]).filter(key => key.startsWith('lesson_')).sort((a, b) => {
      const numA = parseInt(a.replace('lesson_', '')) || 0
      const numB = parseInt(b.replace('lesson_', '')) || 0
      return numA - numB
    })
  }
  
  // Initialize selected lessons when sheet changes
  useEffect(() => {
    if (selectedSheet) {
      const lessons = getLessonsForSheet(selectedSheet)
      setSelectedLessons(lessons)
      setExpandedLessons(new Set())
      setSelectedLesson("")
      setLessonNumber(1)
    }
  }, [selectedSheet, data])

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { getAllSubjects } = await import('../../lib/firebase-client')
        const result = await getAllSubjects()
        setData(result.data || {})
        setStudentBooks(result.studentBooks || {})
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    if (mounted && typeof window !== 'undefined') {
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
    setAuthLoading(true)

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
      setAuthLoading(false)
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
      const { saveLessonData } = await import('../../lib/firebase-client')
      await saveLessonData(selectedSheet, selectedLesson, formData)
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err) {
      console.error('Error saving lesson data:', err)
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
      const { saveStudentBook } = await import('../../lib/firebase-client')
      await saveStudentBook(selectedSheet, studentBook)
      setStudentBookSaveStatus("success")
      setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
    } catch (err) {
      console.error('Error saving student book:', err)
      setStudentBookSaveStatus("error")
      setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
    }
  }

  const toggleTheme = () => {
    if (!setTheme) {
      console.error("setTheme is not available")
      return
    }
    if (typeof window === 'undefined') return
    
    try {
      const newTheme = currentTheme === "light" ? "dark" : "light"
      
      // Update local state immediately for icon
      setCurrentTheme(newTheme)
      
      // Apply immediately to HTML element
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(newTheme)
      root.setAttribute("data-theme", newTheme)
      
      // Then update theme state
      setTheme(newTheme)
    } catch (error) {
      console.error("Error toggling theme:", error)
    }
  }

  const handleDeleteSubject = async (subjectCode: string) => {
    setDeleteStatus({ ...deleteStatus, [subjectCode]: "deleting" })
    
    try {
      const { deleteSubject } = await import('../../lib/firebase-client')
      await deleteSubject(subjectCode)
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
      setStudentBooks(result.studentBooks || {})
      
      // Clear selection if deleted subject was selected
      if (selectedSheet === subjectCode) {
        setSelectedSheet("")
        setSelectedLesson("")
        setExpandedLessons(new Set())
        setSelectedLessons([])
      }
      
      setDeleteStatus({ ...deleteStatus, [subjectCode]: "success" })
      setTimeout(() => {
        const newStatus = { ...deleteStatus }
        delete newStatus[subjectCode]
        setDeleteStatus(newStatus)
      }, 2000)
    } catch (err) {
      console.error('Error deleting subject:', err)
      setDeleteStatus({ ...deleteStatus, [subjectCode]: "error" })
      setTimeout(() => {
        const newStatus = { ...deleteStatus }
        delete newStatus[subjectCode]
        setDeleteStatus(newStatus)
      }, 3000)
    }
  }

  if (!mounted) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
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
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? "Đang xác thực..." : "Đăng nhập"}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa bài học
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Quản lý khóa học
            </TabsTrigger>
          </TabsList>

          {/* Tab: Chỉnh sửa bài học */}
          <TabsContent value="edit" className="mt-0">
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

                {selectedSheet && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Lọc buổi học</Label>
                      <span className="text-sm text-muted-foreground">
                        {selectedLessons.length}/{getLessonsForSheet(selectedSheet).length} buổi
                      </span>
                    </div>
                    
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allLessons = getLessonsForSheet(selectedSheet)
                          setSelectedLessons(allLessons)
                        }}
                      >
                        Tất cả
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lessons = getLessonsForSheet(selectedSheet)
                          const firstHalf = lessons.slice(0, Math.ceil(lessons.length / 2))
                          setSelectedLessons(firstHalf)
                        }}
                      >
                        7 buổi đầu
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lessons = getLessonsForSheet(selectedSheet)
                          const secondHalf = lessons.slice(Math.ceil(lessons.length / 2))
                          setSelectedLessons(secondHalf)
                        }}
                      >
                        7 buổi cuối
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLessons([])}
                      >
                        Bỏ chọn
                      </Button>
                    </div>

                    {/* Lessons list with better styling */}
                    <div className="border rounded-lg p-3 bg-muted/30 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {getLessonsForSheet(selectedSheet).map((lessonKey) => {
                          const num = parseInt(lessonKey.replace('lesson_', '')) || 0
                          const isSelected = selectedLessons.includes(lessonKey)
                          return (
                            <div
                              key={lessonKey}
                              className={`flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedLessons(selectedLessons.filter(l => l !== lessonKey))
                                } else {
                                  setSelectedLessons([...selectedLessons, lessonKey])
                                }
                              }}
                            >
                              <Checkbox
                                id={`lesson-${lessonKey}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLessons([...selectedLessons, lessonKey])
                                  } else {
                                    setSelectedLessons(selectedLessons.filter(l => l !== lessonKey))
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Label
                                htmlFor={`lesson-${lessonKey}`}
                                className="cursor-pointer flex-1 text-sm font-medium"
                              >
                                Buổi {num}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Right Column - Lessons List */}
          {selectedSheet && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách buổi học</CardTitle>
                <CardDescription>Click vào buổi để mở rộng và chỉnh sửa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {getLessonsForSheet(selectedSheet)
                  .filter(lessonKey => selectedLessons.includes(lessonKey))
                  .map((lessonKey) => {
                    const num = parseInt(lessonKey.replace('lesson_', '')) || 0
                    const sheetData = data[selectedSheet as keyof typeof data]
                    const lessonData = sheetData?.[lessonKey as keyof typeof sheetData] as any
                    const isExpanded = expandedLessons.has(lessonKey)
                    const currentFormData = isExpanded && selectedLesson === lessonKey ? formData : {
                      lesson_content: lessonData?.lesson_content || "",
                      next_lesson_content: lessonData?.next_lesson_content || "",
                      video: lessonData?.video || "",
                      next_requirement: lessonData?.next_requirement || "",
                    }
                    
                    return (
                      <Collapsible
                        key={lessonKey}
                        open={isExpanded}
                        onOpenChange={(open) => {
                          const newExpanded = new Set(expandedLessons)
                          if (open) {
                            newExpanded.add(lessonKey)
                            setSelectedLesson(lessonKey)
                            setLessonNumber(num)
                            // Load lesson data
                            if (lessonData) {
                              setFormData({
                                lesson_content: lessonData.lesson_content || "",
                                next_lesson_content: lessonData.next_lesson_content || "",
                                video: lessonData.video || "",
                                next_requirement: lessonData.next_requirement || "",
                              })
                            }
                          } else {
                            newExpanded.delete(lessonKey)
                          }
                          setExpandedLessons(newExpanded)
                        }}
                      >
                        <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors bg-card">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {num}
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="font-semibold text-base">Buổi {num}</span>
                                {lessonData?.lesson_content && (
                                  <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                                    {lessonData.lesson_content.substring(0, 50)}...
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {saveStatus === "saving" && selectedLesson === lessonKey && (
                                <span className="text-sm text-muted-foreground animate-pulse">Đang lưu...</span>
                              )}
                              {saveStatus === "success" && selectedLesson === lessonKey && (
                                <span className="text-sm text-green-600 font-medium">✓ Đã lưu</span>
                              )}
                              {saveStatus === "error" && selectedLesson === lessonKey && (
                                <span className="text-sm text-red-600">✗ Lỗi</span>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-5 space-y-4 border-t bg-muted/20">
                              <div className="space-y-2">
                                <Label htmlFor={`lesson_content_${lessonKey}`}>Nội dung buổi học:</Label>
                                <Textarea
                                  id={`lesson_content_${lessonKey}`}
                                  value={currentFormData.lesson_content}
                                  onChange={(e) => {
                                    if (selectedLesson === lessonKey) {
                                      handleFieldChange("lesson_content", e.target.value)
                                    }
                                  }}
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`video_${lessonKey}`}>Link video:</Label>
                                <Input
                                  id={`video_${lessonKey}`}
                                  type="url"
                                  value={currentFormData.video}
                                  onChange={(e) => {
                                    if (selectedLesson === lessonKey) {
                                      handleFieldChange("video", e.target.value)
                                    }
                                  }}
                                  placeholder="Link video..."
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`next_requirement_${lessonKey}`}>Yêu cầu cho buổi tiếp theo:</Label>
                                <Textarea
                                  id={`next_requirement_${lessonKey}`}
                                  value={currentFormData.next_requirement}
                                  onChange={(e) => {
                                    if (selectedLesson === lessonKey) {
                                      handleFieldChange("next_requirement", e.target.value)
                                    }
                                  }}
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`next_lesson_content_${lessonKey}`}>Nội dung buổi tới:</Label>
                                <Textarea
                                  id={`next_lesson_content_${lessonKey}`}
                                  value={currentFormData.next_lesson_content}
                                  onChange={(e) => {
                                    if (selectedLesson === lessonKey) {
                                      handleFieldChange("next_lesson_content", e.target.value)
                                    }
                                  }}
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={() => {
                                    setSelectedLesson(lessonKey)
                                    handleSave()
                                  }}
                                  className="flex-1"
                                  disabled={saveStatus === "saving" || selectedLesson !== lessonKey}
                                  size="lg"
                                >
                                  {saveStatus === "saving" && selectedLesson === lessonKey
                                    ? "Đang lưu..."
                                    : saveStatus === "success" && selectedLesson === lessonKey
                                    ? "✓ Đã lưu thành công"
                                    : saveStatus === "error" && selectedLesson === lessonKey
                                    ? "✗ Lỗi khi lưu"
                                    : "💾 Lưu thay đổi"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedLessons)
                                    newExpanded.delete(lessonKey)
                                    setExpandedLessons(newExpanded)
                                    if (selectedLesson === lessonKey) {
                                      setSelectedLesson("")
                                    }
                                  }}
                                  size="lg"
                                >
                                  Thu gọn
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
              </CardContent>
            </Card>
          )}
            </div>
          </TabsContent>

          {/* Tab: Quản lý khóa học */}
          <TabsContent value="manage" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-4 w-4" />
                  Quản lý khóa học
                </CardTitle>
                <CardDescription className="text-sm">Xem và xóa các khóa học</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {sheets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Chưa có khóa học nào</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {sheets.map((sheet) => {
                      const lessons = getLessonsForSheet(sheet)
                      const lessonCount = lessons.length
                      const isDeleting = deleteStatus[sheet] === "deleting"
                      const isSuccess = deleteStatus[sheet] === "success"
                      const isError = deleteStatus[sheet] === "error"
                      
                      return (
                        <div
                          key={sheet}
                          className="border rounded-md p-2.5 hover:bg-muted/50 transition-colors relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">{sheet}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {lessonCount} buổi
                              </p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isDeleting}
                                  className="h-7 px-2 text-xs"
                                >
                                  {isDeleting ? (
                                    <span className="animate-pulse text-[10px]">...</span>
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa khóa học</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa khóa học <strong>{sheet}</strong>?
                                    <br />
                                    <span className="text-destructive font-medium">
                                      Hành động này không thể hoàn tác!
                                    </span>
                                    <br />
                                    Tất cả {lessonCount} buổi học sẽ bị xóa vĩnh viễn.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubject(sheet)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Xóa khóa học
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          {isSuccess && (
                            <div className="mt-1.5 text-[10px] text-green-600 font-medium">✓ Đã xóa</div>
                          )}
                          {isError && (
                            <div className="mt-1.5 text-[10px] text-red-600 font-medium">✗ Lỗi</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
