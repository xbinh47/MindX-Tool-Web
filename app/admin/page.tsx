"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Moon, Sun, ChevronDown, ChevronRight, Trash2, BookOpen, Edit3, Plus, Pencil, GripVertical } from "lucide-react"
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
  
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedLesson, setSelectedLesson] = useState<string>("")
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState<boolean>(false)
  const [hoveredSubject, setHoveredSubject] = useState<string>("")
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
  const [data, setData] = useState<Record<string, Record<string, Record<string, any>>>>({})
  const [studentBooks, setStudentBooks] = useState<Record<string, string>>({})
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [selectedLessons, setSelectedLessons] = useState<string[]>([])
  const [deleteStatus, setDeleteStatus] = useState<Record<string, "idle" | "deleting" | "success" | "error">>({})
  const [activeTab, setActiveTab] = useState<string>("edit")

  // States for create/edit dialogs
  const [isCreateSubjectDialogOpen, setIsCreateSubjectDialogOpen] = useState<boolean>(false)
  const [isCreateLevelDialogOpen, setIsCreateLevelDialogOpen] = useState<boolean>(false)
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState<boolean>(false)
  const [editingSubject, setEditingSubject] = useState<string>("")
  const [createSubjectCode, setCreateSubjectCode] = useState<string>("")
  const [createSubjectName, setCreateSubjectName] = useState<string>("")
  const [editSubjectName, setEditSubjectName] = useState<string>("")
  const [createLevelSubject, setCreateLevelSubject] = useState<string>("")
  const [createLevelCode, setCreateLevelCode] = useState<string>("")
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "success" | "error">("idle")
  const [createError, setCreateError] = useState<string>("")
  
  // Drag and drop states
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null)
  const [draggedLevel, setDraggedLevel] = useState<{ subject: string; level: string } | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverLevelIndex, setDragOverLevelIndex] = useState<{ subject: string; index: number } | null>(null)

  const subjects = Object.keys(data)

  // Helper function: Lấy tên subject từ code
  const getSubjectName = (code: string): string => {
    return subjectNames[code] || code
  }

  // Helper function: Lấy danh sách levels cho một subject
  const getLevelsForSubject = (subjectCode: string): string[] => {
    if (!subjectCode || !data[subjectCode]) return []
    return Object.keys(data[subjectCode])
  }
  
  // Get all lessons for selected subject and level
  const getLessonsForLevel = (subjectCode: string, levelCode: string): string[] => {
    if (!subjectCode || !levelCode || !data[subjectCode] || !data[subjectCode][levelCode]) return []
    return Object.keys(data[subjectCode][levelCode]).filter(key => key.startsWith('lesson_')).sort((a, b) => {
      const numA = parseInt(a.replace('lesson_', '')) || 0
      const numB = parseInt(b.replace('lesson_', '')) || 0
      return numA - numB
    })
  }
  
  // Initialize selected lessons when subject and level change
  useEffect(() => {
    if (selectedSubject && selectedLevel) {
      const lessons = getLessonsForLevel(selectedSubject, selectedLevel)
      setSelectedLessons(lessons)
      setExpandedLessons(new Set())
      setSelectedLesson("")
      setLessonNumber(1)
    }
  }, [selectedSubject, selectedLevel, data])

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { getAllSubjects } = await import('../../lib/firebase-client')
        const result = await getAllSubjects()
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

  // Update selectedLesson when subject, level or lessonNumber changes
  useEffect(() => {
    if (selectedSubject && selectedLevel && lessonNumber) {
      const lessonKey = `lesson_${lessonNumber}`
      setSelectedLesson(lessonKey)
    }
  }, [selectedSubject, selectedLevel, lessonNumber])

  // Load student book when selectedLevel changes
  useEffect(() => {
    if (selectedLevel && isAuthenticated) {
      const book = studentBooks[selectedLevel] || ""
      setStudentBook(book)
    }
  }, [selectedLevel, isAuthenticated, studentBooks])

  // Load lesson data when selectedSubject, selectedLevel and selectedLesson change
  useEffect(() => {
    if (selectedSubject && selectedLevel && selectedLesson && isAuthenticated) {
      const levelData = data[selectedSubject]?.[selectedLevel]
      const lessonData = levelData?.[selectedLesson] as any
      if (lessonData) {
        setFormData({
          lesson_content: lessonData.lesson_content || "",
          next_lesson_content: lessonData.next_lesson_content || "",
          video: lessonData.video || "",
          next_requirement: lessonData.next_requirement || "",
        })
      }
    }
  }, [selectedSubject, selectedLevel, selectedLesson, isAuthenticated, data])

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
    if (!selectedSubject || !selectedLevel || !selectedLesson) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
      return
    }

    setSaveStatus("saving")
    
    try {
      const { saveLessonData } = await import('../../lib/firebase-client')
      await saveLessonData(selectedSubject, selectedLevel, selectedLesson, formData)
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 2000)
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
    } catch (err) {
      console.error('Error saving lesson data:', err)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const handleSaveStudentBook = async () => {
    if (!selectedLevel) {
      setStudentBookSaveStatus("error")
      setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
      return
    }

    setStudentBookSaveStatus("saving")
    
    try {
      const { saveStudentBook } = await import('../../lib/firebase-client')
      await saveStudentBook(selectedLevel, studentBook)
      setStudentBookSaveStatus("success")
      setTimeout(() => setStudentBookSaveStatus("idle"), 2000)
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setStudentBooks(result.studentBooks || {})
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
      setSubjectNames(result.subjectNames || {})
      
      // Clear selection if deleted subject was selected
      if (selectedSubject === subjectCode) {
        setSelectedSubject("")
        setSelectedLevel("")
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

  const handleCreateSubject = async () => {
    if (!createSubjectCode.trim() || !createSubjectName.trim()) {
      setCreateError("Vui lòng điền đầy đủ thông tin")
      setCreateStatus("error")
      setTimeout(() => setCreateStatus("idle"), 2000)
      return
    }

    setCreateStatus("creating")
    setCreateError("")
    
    try {
      const { createSubject } = await import('../../lib/firebase-client')
      await createSubject(createSubjectCode.trim().toUpperCase(), createSubjectName.trim())
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
      setStudentBooks(result.studentBooks || {})
      setSubjectNames(result.subjectNames || {})
      
      setCreateStatus("success")
      setIsCreateSubjectDialogOpen(false)
      setCreateSubjectCode("")
      setCreateSubjectName("")
      setTimeout(() => setCreateStatus("idle"), 2000)
    } catch (err: any) {
      console.error('Error creating subject:', err)
      setCreateError(err.message || "Có lỗi xảy ra")
      setCreateStatus("error")
      setTimeout(() => setCreateStatus("idle"), 3000)
    }
  }

  const handleEditSubject = async () => {
    if (!editingSubject || !editSubjectName.trim()) {
      setCreateError("Vui lòng điền đầy đủ thông tin")
      setCreateStatus("error")
      setTimeout(() => setCreateStatus("idle"), 2000)
      return
    }

    setCreateStatus("creating")
    setCreateError("")
    
    try {
      const { updateSubjectName } = await import('../../lib/firebase-client')
      await updateSubjectName(editingSubject, editSubjectName.trim())
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
      setStudentBooks(result.studentBooks || {})
      setSubjectNames(result.subjectNames || {})
      
      setCreateStatus("success")
      setIsEditSubjectDialogOpen(false)
      setEditingSubject("")
      setEditSubjectName("")
      setTimeout(() => setCreateStatus("idle"), 2000)
    } catch (err: any) {
      console.error('Error updating subject:', err)
      setCreateError(err.message || "Có lỗi xảy ra")
      setCreateStatus("error")
      setTimeout(() => setCreateStatus("idle"), 3000)
    }
  }

  const handleCreateLevel = async () => {
    if (!createLevelSubject || !createLevelCode.trim()) {
      setCreateError("Vui lòng điền đầy đủ thông tin")
      setCreateStatus("error")
      setTimeout(() => setCreateStatus("idle"), 2000)
      return
    }

    setCreateStatus("creating")
    setCreateError("")
    
    try {
      const { createLevel } = await import('../../lib/firebase-client')
      await createLevel(createLevelSubject, createLevelCode.trim().toUpperCase())
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
      setStudentBooks(result.studentBooks || {})
      setSubjectNames(result.subjectNames || {})
      
      setCreateStatus("success")
      setIsCreateLevelDialogOpen(false)
      setCreateLevelSubject("")
      setCreateLevelCode("")
      setTimeout(() => setCreateStatus("idle"), 2000)
    } catch (err: any) {
      console.error('Error creating level:', err)
      setCreateError(err.message || "Có lỗi xảy ra")
      setCreateStatus("error")
      setTimeout(() => setCreateStatus("idle"), 3000)
    }
  }

  const openEditSubjectDialog = (subjectCode: string) => {
    setEditingSubject(subjectCode)
    setEditSubjectName(getSubjectName(subjectCode))
    setIsEditSubjectDialogOpen(true)
  }

  const openCreateLevelDialog = (subjectCode: string) => {
    setCreateLevelSubject(subjectCode)
    setCreateLevelCode("")
    setIsCreateLevelDialogOpen(true)
  }

  // Drag and drop handlers for subjects
  const handleSubjectDragStart = (e: React.DragEvent, subjectCode: string) => {
    setDraggedSubject(subjectCode)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleSubjectDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleSubjectDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedSubject) return

    const subjectList = Object.keys(data)
    const draggedIndex = subjectList.indexOf(draggedSubject)
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedSubject(null)
      setDragOverIndex(null)
      return
    }

    try {
      const { updateSubjectOrder } = await import('../../lib/firebase-client')
      
      // Cập nhật order cho tất cả subjects bị ảnh hưởng
      const promises: Promise<void>[] = []
      
      if (draggedIndex < targetIndex) {
        // Kéo xuống: giảm order của các items ở giữa
        for (let i = draggedIndex + 1; i <= targetIndex; i++) {
          promises.push(updateSubjectOrder(subjectList[i], i - 1))
        }
        promises.push(updateSubjectOrder(draggedSubject, targetIndex))
      } else {
        // Kéo lên: tăng order của các items ở giữa
        for (let i = targetIndex; i < draggedIndex; i++) {
          promises.push(updateSubjectOrder(subjectList[i], i + 1))
        }
        promises.push(updateSubjectOrder(draggedSubject, targetIndex))
      }
      
      await Promise.all(promises)
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
      setStudentBooks(result.studentBooks || {})
      setSubjectNames(result.subjectNames || {})
    } catch (err) {
      console.error('Error updating subject order:', err)
    } finally {
      setDraggedSubject(null)
      setDragOverIndex(null)
    }
  }

  // Drag and drop handlers for levels
  const handleLevelDragStart = (e: React.DragEvent, subjectCode: string, levelCode: string) => {
    setDraggedLevel({ subject: subjectCode, level: levelCode })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleLevelDragOver = (e: React.DragEvent, subjectCode: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverLevelIndex({ subject: subjectCode, index })
  }

  const handleLevelDrop = async (e: React.DragEvent, subjectCode: string, targetIndex: number) => {
    e.preventDefault()
    if (!draggedLevel || draggedLevel.subject !== subjectCode) return

    const levels = getLevelsForSubject(subjectCode)
    const draggedIndex = levels.indexOf(draggedLevel.level)
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedLevel(null)
      setDragOverLevelIndex(null)
      return
    }

    try {
      const { updateLevelOrder } = await import('../../lib/firebase-client')
      
      // Cập nhật order cho tất cả levels bị ảnh hưởng
      const promises: Promise<void>[] = []
      
      if (draggedIndex < targetIndex) {
        // Kéo xuống: giảm order của các items ở giữa
        for (let i = draggedIndex + 1; i <= targetIndex; i++) {
          promises.push(updateLevelOrder(subjectCode, levels[i], i - 1))
        }
        promises.push(updateLevelOrder(subjectCode, draggedLevel.level, targetIndex))
      } else {
        // Kéo lên: tăng order của các items ở giữa
        for (let i = targetIndex; i < draggedIndex; i++) {
          promises.push(updateLevelOrder(subjectCode, levels[i], i + 1))
        }
        promises.push(updateLevelOrder(subjectCode, draggedLevel.level, targetIndex))
      }
      
      await Promise.all(promises)
      
      // Refresh data
      const { getAllSubjects } = await import('../../lib/firebase-client')
      const result = await getAllSubjects()
      setData(result.data || {})
      setStudentBooks(result.studentBooks || {})
      setSubjectNames(result.subjectNames || {})
    } catch (err) {
      console.error('Error updating level order:', err)
    } finally {
      setDraggedLevel(null)
      setDragOverLevelIndex(null)
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
                <div className="space-y-2 relative">
                  <Label htmlFor="subject">Môn học:</Label>
                  <button
                    type="button"
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
                                    setTimeout(() => {
                                      const buttonRect = el.parentElement?.getBoundingClientRect()
                                      if (!buttonRect) return

                                      const viewportWidth = window.innerWidth
                                      const viewportHeight = window.innerHeight

                                      let left = buttonRect.right + 4
                                      let top = buttonRect.top

                                      if (left + 300 > viewportWidth - 20) {
                                        left = buttonRect.left - 300 - 4
                                      }

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

                {selectedSubject && selectedLevel && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Lọc buổi học</Label>
                      <span className="text-sm text-muted-foreground">
                        {selectedLessons.length}/{getLessonsForLevel(selectedSubject, selectedLevel).length} buổi
                      </span>
                    </div>
                    
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allLessons = getLessonsForLevel(selectedSubject, selectedLevel)
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
                          const lessons = getLessonsForLevel(selectedSubject, selectedLevel)
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
                          const lessons = getLessonsForLevel(selectedSubject, selectedLevel)
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
                        {getLessonsForLevel(selectedSubject, selectedLevel).map((lessonKey) => {
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
            {selectedLevel && (
              <Card>
                <CardHeader>
                  <CardTitle>Student Book (Toàn khóa học)</CardTitle>
                  <CardDescription>Student Book áp dụng cho level {selectedLevel}</CardDescription>
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
          {selectedSubject && selectedLevel && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách buổi học</CardTitle>
                <CardDescription>Click vào buổi để mở rộng và chỉnh sửa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {getLessonsForLevel(selectedSubject, selectedLevel)
                  .filter(lessonKey => selectedLessons.includes(lessonKey))
                  .map((lessonKey) => {
                    const num = parseInt(lessonKey.replace('lesson_', '')) || 0
                    const levelData = data[selectedSubject]?.[selectedLevel]
                    const lessonData = levelData?.[lessonKey] as any
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
                <div className="flex items-center justify-between">
                  <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-4 w-4" />
                  Quản lý khóa học
                </CardTitle>
                    <CardDescription className="text-sm">Xem, thêm, chỉnh sửa và xóa các khóa học</CardDescription>
                  </div>
                  <Dialog open={isCreateSubjectDialogOpen} onOpenChange={setIsCreateSubjectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm khóa học
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm khóa học mới</DialogTitle>
                        <DialogDescription>
                          Nhập mã và tên khóa học mới
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="subjectCode">Mã khóa học:</Label>
                          <Input
                            id="subjectCode"
                            value={createSubjectCode}
                            onChange={(e) => setCreateSubjectCode(e.target.value)}
                            placeholder="VD: NEW"
                            className="uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subjectName">Tên khóa học:</Label>
                          <Input
                            id="subjectName"
                            value={createSubjectName}
                            onChange={(e) => setCreateSubjectName(e.target.value)}
                            placeholder="VD: Khóa học mới"
                          />
                        </div>
                        {createError && (
                          <div className="text-sm text-destructive">{createError}</div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreateSubjectDialogOpen(false)
                            setCreateSubjectCode("")
                            setCreateSubjectName("")
                            setCreateError("")
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleCreateSubject}
                          disabled={createStatus === "creating"}
                        >
                          {createStatus === "creating" ? "Đang tạo..." : createStatus === "success" ? "Đã tạo!" : "Tạo khóa học"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {subjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Chưa có khóa học nào</p>
                ) : (
                  <div className="space-y-4">
                    {subjects.map((subject, subjectIndex) => {
                      const subjectName = getSubjectName(subject)
                      const levels = getLevelsForSubject(subject)
                      const totalLessons = levels.reduce((total, level) => {
                        return total + getLessonsForLevel(subject, level).length
                      }, 0)
                      const isDeleting = deleteStatus[subject] === "deleting"
                      const isSuccess = deleteStatus[subject] === "success"
                      const isError = deleteStatus[subject] === "error"
                      
                      return (
                        <div
                          key={subject}
                          draggable
                          onDragStart={(e) => handleSubjectDragStart(e, subject)}
                          onDragOver={(e) => handleSubjectDragOver(e, subjectIndex)}
                          onDrop={(e) => handleSubjectDrop(e, subjectIndex)}
                          onDragEnd={() => {
                            setDraggedSubject(null)
                            setDragOverIndex(null)
                          }}
                          className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                            draggedSubject === subject ? 'opacity-50' : ''
                          } ${
                            dragOverIndex === subjectIndex ? 'border-primary border-2' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base">{subjectName}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {levels.length} level, {totalLessons} buổi
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCreateLevelDialog(subject)}
                                className="h-7 px-2 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Thêm level
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditSubjectDialog(subject)}
                                className="h-7 px-2 text-xs"
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Sửa
                              </Button>
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
                                    Bạn có chắc chắn muốn xóa khóa học <strong>{subjectName}</strong>?
                                    <br />
                                    <span className="text-destructive font-medium">
                                      Hành động này không thể hoàn tác!
                                    </span>
                                    <br />
                                    Tất cả {totalLessons} buổi học trong {levels.length} level sẽ bị xóa vĩnh viễn.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubject(subject)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Xóa khóa học
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          </div>
                          
                          {/* Levels list with drag and drop */}
                          {levels.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-muted-foreground mb-2">Levels:</div>
                              <div className="flex flex-wrap gap-2">
                                {levels.map((level, levelIndex) => (
                                  <div
                                    key={level}
                                    draggable
                                    onDragStart={(e) => handleLevelDragStart(e, subject, level)}
                                    onDragOver={(e) => handleLevelDragOver(e, subject, levelIndex)}
                                    onDrop={(e) => handleLevelDrop(e, subject, levelIndex)}
                                    onDragEnd={() => {
                                      setDraggedLevel(null)
                                      setDragOverLevelIndex(null)
                                    }}
                                    className={`text-xs px-2 py-1 bg-muted rounded border flex items-center gap-1 cursor-move ${
                                      draggedLevel?.subject === subject && draggedLevel?.level === level ? 'opacity-50' : ''
                                    } ${
                                      dragOverLevelIndex?.subject === subject && dragOverLevelIndex?.index === levelIndex 
                                        ? 'border-primary border-2' : ''
                                    }`}
                                  >
                                    <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span>{level}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

      {/* Dialog: Edit Subject */}
      <Dialog open={isEditSubjectDialogOpen} onOpenChange={setIsEditSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
            <DialogDescription>
              Cập nhật tên khóa học
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSubjectName">Tên khóa học:</Label>
              <Input
                id="editSubjectName"
                value={editSubjectName}
                onChange={(e) => setEditSubjectName(e.target.value)}
                placeholder="Tên khóa học"
              />
            </div>
            {createError && (
              <div className="text-sm text-destructive">{createError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSubjectDialogOpen(false)
                setEditingSubject("")
                setEditSubjectName("")
                setCreateError("")
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleEditSubject}
              disabled={createStatus === "creating"}
            >
              {createStatus === "creating" ? "Đang cập nhật..." : createStatus === "success" ? "Đã cập nhật!" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Level */}
      <Dialog open={isCreateLevelDialogOpen} onOpenChange={setIsCreateLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm level mới</DialogTitle>
            <DialogDescription>
              Thêm level mới cho khóa học {createLevelSubject ? getSubjectName(createLevelSubject) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="levelCode">Mã level:</Label>
              <Input
                id="levelCode"
                value={createLevelCode}
                onChange={(e) => setCreateLevelCode(e.target.value)}
                placeholder="VD: NEWB, NEWA, NEWI"
                className="uppercase"
              />
            </div>
            {createError && (
              <div className="text-sm text-destructive">{createError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateLevelDialogOpen(false)
                setCreateLevelSubject("")
                setCreateLevelCode("")
                setCreateError("")
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateLevel}
              disabled={createStatus === "creating"}
            >
              {createStatus === "creating" ? "Đang tạo..." : createStatus === "success" ? "Đã tạo!" : "Tạo level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
