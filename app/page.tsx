"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CKEditor } from "@/components/ui/ckeditor"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, ChevronRight } from "lucide-react"
import { useTheme } from "next-themes"

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
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState<boolean>(false)
  const [hoveredSubject, setHoveredSubject] = useState<string>("")
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
  const [classSituation, setClassSituation] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [data, setData] = useState<Record<string, Record<string, Record<string, any>>>>({})
  const [studentBooks, setStudentBooks] = useState<Record<string, string>>({})
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(true)

  const subjects = Object.keys(data)

  // Helper function: Lấy tên subject từ code (từ Firebase hoặc fallback)
  const getSubjectName = (code: string): string => {
    return subjectNames[code] || code
  }

  // Helper function: Lấy danh sách levels cho một subject
  const getLevelsForSubject = (subjectCode: string): string[] => {
    if (!subjectCode || !data[subjectCode]) {
      console.log(`[DEBUG] Subject ${subjectCode} không có trong data:`, Object.keys(data))
      return []
    }
    const levels = Object.keys(data[subjectCode])
    console.log(`[DEBUG] Subject ${subjectCode} có ${levels.length} levels:`, levels)
    return levels
  }

  // Helper function: Lấy danh sách lessons đã sắp xếp theo số thứ tự cho một level
  const getSortedLessons = (subjectCode: string, levelCode: string): string[] => {
    if (!subjectCode || !levelCode || !data[subjectCode] || !data[subjectCode][levelCode]) return []
    return Object.keys(data[subjectCode][levelCode])
      .filter(key => key.startsWith('lesson_'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('lesson_', '')) || 0
        const numB = parseInt(b.replace('lesson_', '')) || 0
        return numA - numB
      })
  }

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { getAllSubjects } = await import('../lib/firebase-client')
        const result = await getAllSubjects()
        console.log('[DEBUG] Fetched data:', result)
        console.log('[DEBUG] ROB data:', result.data?.ROB)
        setData(result.data || {})
        setStudentBooks(result.studentBooks || {})
        setSubjectNames(result.subjectNames || {})
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    if (mounted && typeof window !== 'undefined') {
      const root = document.documentElement
      const currentTheme = theme || "light"
      
      // Remove all theme classes
      root.classList.remove("light", "dark")
      
      // Add current theme class
      root.classList.add(currentTheme)
      
      // Also set data-theme attribute
      root.setAttribute("data-theme", currentTheme)
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

  // Reset level khi subject thay đổi
  useEffect(() => {
    if (selectedSubject) {
      const levels = getLevelsForSubject(selectedSubject)
      if (levels.length > 0 && !levels.includes(selectedLevel)) {
        setSelectedLevel(levels[0])
      } else if (levels.length === 0) {
        setSelectedLevel("")
      }
    } else {
      setSelectedLevel("")
    }
  }, [selectedSubject, data])

  // Khi chọn level mới, tự động chọn lesson đầu tiên
  useEffect(() => {
    if (selectedSubject && selectedLevel && data[selectedSubject] && data[selectedSubject][selectedLevel]) {
      const sortedLessons = getSortedLessons(selectedSubject, selectedLevel)
      if (sortedLessons.length > 0) {
        const firstLesson = sortedLessons[0]
        const num = parseInt(firstLesson.replace('lesson_', '')) || 1
        setLessonNumber(num)
        setSelectedLesson(firstLesson)
      } else {
        // Nếu không có lesson nào, reset
        setLessonNumber(1)
        setSelectedLesson("")
      }
    } else if (!selectedSubject || !selectedLevel) {
      // Reset khi không chọn subject hoặc level
      setLessonNumber(1)
      setSelectedLesson("")
    }
  }, [selectedSubject, selectedLevel, data])

  // Khi lessonNumber thay đổi, cập nhật selectedLesson
  useEffect(() => {
    if (selectedSubject && selectedLevel && lessonNumber) {
      const lessonKey = `lesson_${lessonNumber}`
      const sortedLessons = getSortedLessons(selectedSubject, selectedLevel)
      // Chỉ set nếu lesson tồn tại
      if (sortedLessons.includes(lessonKey)) {
        setSelectedLesson(lessonKey)
      }
    }
  }, [lessonNumber, selectedSubject, selectedLevel, data])

  // Load lesson data khi selectedSubject, selectedLevel và selectedLesson thay đổi
  useEffect(() => {
    if (selectedSubject && selectedLevel && selectedLesson && data[selectedSubject] && data[selectedSubject][selectedLevel]) {
      const levelData = data[selectedSubject][selectedLevel]
      const lessonData = levelData[selectedLesson] as any
      const studentBook = (studentBooks as Record<string, string>)[selectedLevel] || ""
      
      if (lessonData) {
        // Map data đúng vào form fields
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
        // Reset form nếu lesson không tồn tại
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
    } else if (!selectedSubject || !selectedLevel || !selectedLesson) {
      // Reset form khi không chọn subject, level hoặc lesson
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
  }, [selectedSubject, selectedLevel, selectedLesson, data, studentBooks])

  const handleFieldChange = (field: keyof LessonData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCheckedFields((prev) => ({ ...prev, [field]: checked }))
  }


  const generateContent = () => {
    let content = ""
    
    if (!selectedSubject || !selectedLevel || !selectedLesson) {
      setResult("Vui lòng chọn Môn học, Level và Bài học trước khi tạo nội dung.")
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

    // Tình hình học tập của lớp
    if (classSituation.trim()) {
      content += `**📊 Tình hình học tập của lớp:**\n${classSituation}\n`
    }

    // Student Book - chỉ thêm nếu checkbox được chọn
    if (checkedFields.slide && formData.student_book.trim()) {
      content += `**📚 Student Book:**\n${formData.student_book}\n`
    }

    // Link video - chỉ thêm nếu checkbox được chọn
    if (checkedFields.video && formData.video.trim()) {
      content += `**🎥 Link video:**\n${formData.video}\n`
    }

    // Kết quả bài tập về nhà - chỉ thêm nếu checkbox được chọn
    if (checkedFields.homework_result && formData.homework_result.trim()) {
      content += `**✅ Kết quả bài tập về nhà:**\n${formData.homework_result}\n`
    }

    // Yêu cầu cho buổi tiếp theo - chỉ thêm nếu checkbox được chọn
    if (checkedFields.next_requirement && formData.next_requirement.trim()) {
      content += `**📋 Yêu cầu cho buổi tiếp theo:**\n${formData.next_requirement}\n`
    }

    // Hạn nộp bài - chỉ thêm nếu checkbox được chọn
    if (checkedFields.deadline && formData.deadline.trim()) {
      content += `**⏰ Hạn nộp bài:**\n${formData.deadline}\n`
    }

    // Nội dung buổi tới - chỉ thêm nếu checkbox được chọn
    if (checkedFields.next_lesson_content && formData.next_lesson_content.trim()) {
      content += `**📖 Nội dung buổi tới:**\n${formData.next_lesson_content}\n`
    }

    // Tình hình học tập của lớp (nếu có)
    // Note: This field is currently empty in the form, but we can add it if needed

    setResult(content.trim())
  }

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

          {/* Subject and Level Selection */}
            <div className="space-y-2">
            <Label>Môn học và Level:</Label>
            <div className="relative">
              {/* Subject Selector Button */}
              <button
                type="button"
                ref={(el) => {
                  if (el) {
                    // Lưu reference của main button để dùng cho submenu positioning
                    (window as any).__mainSubjectButtonRef = el
                  }
                }}
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="w-full text-left px-4 py-3 rounded-md text-sm border bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center justify-between"
              >
                <span>
                  {selectedSubject 
                    ? getSubjectName(selectedSubject) 
                    : "Chọn môn học"}
                </span>
                <ChevronRight 
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isSubjectDropdownOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Subject Dropdown Menu */}
              {isSubjectDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 border rounded-md divide-y bg-background shadow-lg z-50 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {subjects.map((subject) => {
                    const isSelected = selectedSubject === subject
                    const isHovered = hoveredSubject === subject
                    const subjectName = getSubjectName(subject)
                    const levels = getLevelsForSubject(subject)
                    const hasLevels = levels.length > 0
                    
                    return (
                      <div
                        key={subject}
                        className="relative group"
                        onMouseEnter={() => hasLevels && setHoveredSubject(subject)}
                        onMouseLeave={() => setHoveredSubject("")}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubject(subject)
                            if (hasLevels && !levels.includes(selectedLevel)) {
                              setSelectedLevel(levels[0])
                            }
                            setIsSubjectDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-3 rounded-md text-sm transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <span>{subjectName}</span>
                          {hasLevels && (
                            <ChevronRight 
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                isHovered ? 'translate-x-1' : ''
                              }`}
                            />
                          )}
                        </button>
                        
                        {/* Submenu: Level List - hiện khi hover vào subject */}
                        {isHovered && hasLevels && (
                          <div 
                            className="fixed min-w-[200px] max-w-[300px] border rounded-md bg-background shadow-lg"
                            style={{
                              maxHeight: 'calc(100vh - 200px)',
                              overflowY: 'auto',
                              zIndex: 100
                            }}
                            onMouseEnter={() => setHoveredSubject(subject)}
                            onMouseLeave={() => setHoveredSubject("")}
                            ref={(el) => {
                              if (el && el.parentElement) {
                                // Điều chỉnh vị trí sau khi render xong
                                setTimeout(() => {
                                  // Lấy vị trí của subject button (item đang được hover)
                                  const subjectButton = el.parentElement?.querySelector('button') as HTMLElement
                                  if (!subjectButton) return
                                  
                                  const subjectButtonRect = subjectButton.getBoundingClientRect()
                                  const viewportWidth = window.innerWidth
                                  const viewportHeight = window.innerHeight
                                  
                                  // Tính toán vị trí: bên phải của subject button
                                  let left = subjectButtonRect.right + 4
                                  // Top của submenu = top của subject button (để option đầu tiên ngang với subject item)
                                  // Trừ đi chiều cao của header "Level" để option đầu tiên ngang với subject item
                                  const headerHeight = el.querySelector('.text-xs.font-medium')?.getBoundingClientRect().height || 0
                                  let top = subjectButtonRect.top - headerHeight
                                  
                                  // Nếu tràn ra ngoài màn hình bên phải, hiện bên trái
                                  if (left + 300 > viewportWidth - 20) {
                                    left = subjectButtonRect.left - 300 - 4
                                  }
                                  
                                  // Điều chỉnh vị trí dọc nếu tràn ra ngoài màn hình
                                  if (top + el.offsetHeight > viewportHeight - 20) {
                                    top = viewportHeight - el.offsetHeight - 20
                                  }
                                  
                                  el.style.left = `${left}px`
                                  el.style.top = `${top}px`
                                }, 0)
                              }
                            }}
                          >
                            <div className="text-xs font-medium text-muted-foreground px-4 py-2 border-b bg-muted/50 sticky top-0">
                              Level
                            </div>
                            <div className="divide-y">
                              {levels.map((level) => {
                                const isLevelSelected = selectedLevel === level && selectedSubject === subject
                                return (
                                  <button
                                    key={level}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubject(subject)
                                      setSelectedLevel(level)
                                      setIsSubjectDropdownOpen(false)
                                      setHoveredSubject("")
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 ${
                                      isLevelSelected
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                  >
                                    {level}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
              </div>

            <div className="space-y-2">
              <Label htmlFor="lessonNumber">Số bài học:</Label>
              <Select
                value={selectedSubject && selectedLevel && selectedLesson ? lessonNumber.toString() : ""}
                onValueChange={(value) => {
                  const num = parseInt(value) || 1
                  setLessonNumber(num)
                }}
                disabled={!selectedSubject || !selectedLevel}
              >
                <SelectTrigger id="lessonNumber" className="w-full">
                  <SelectValue placeholder={selectedSubject && selectedLevel ? "Chọn bài học" : "Chọn môn học và level trước"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubject && selectedLevel && getSortedLessons(selectedSubject, selectedLevel).map((lesson) => {
                    const num = parseInt(lesson.replace('lesson_', '')) || 1
                    return (
                      <SelectItem key={lesson} value={num.toString()}>
                        Bài {num}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
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
                value={classSituation}
                onChange={(e) => setClassSituation(e.target.value)}
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
              <div className="space-y-2">
                <CKEditor
                  value={result 
                    ? result
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br>')
                    : ''}
                  onChange={(data) => {
                    // Convert HTML back to markdown format
                    const text = data
                      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                      .replace(/<b>(.*?)<\/b>/g, '**$1**')
                      .replace(/<br\s*\/?>/g, '\n')
                      .replace(/&nbsp;/g, ' ')
                      .replace(/<p>(.*?)<\/p>/g, '$1\n')
                      .replace(/<\/?[^>]+(>|$)/g, '')
                      .trim()
                    setResult(text)
                  }}
                  placeholder={result ? "Kết quả sẽ hiển thị ở đây..." : "Vui lòng chọn Sheet và Bài học trước khi tạo nội dung."}
                />
                {result && (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 text-sm text-muted-foreground">
        © Xuân Bình
      </div>
    </div>
  )
}
