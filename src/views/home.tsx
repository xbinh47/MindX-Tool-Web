"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react"
// Import subjects.json từ root directory
// @ts-ignore - JSON import
import subjectsData from "../../subjects.json"

interface LessonData {
  lesson_content: string
  student_book: string
  next_lesson_content: string
  video: string
  homework_result: string
  deadline: string
  next_requirement: string
}

interface SubjectData {
  [levelKey: string]: {
    [lessonKey: string]: LessonData
  }
}

interface SubjectsStructure {
  [subjectName: string]: SubjectData | {
    ROB?: {
      [levelKey: string]: {
        [lessonKey: string]: LessonData
      }
    }
  }
}


export default function Home() {
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedLesson, setSelectedLesson] = useState<string>("")
  const [lessonNumber, setLessonNumber] = useState<number>(1)
  const [openAccordion, setOpenAccordion] = useState<string>("")
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

  const data = subjectsData as SubjectsStructure
  const subjects = Object.keys(data)

  // Lấy danh sách levels dựa trên subject đã chọn
  const getLevelsForSubject = (subjectName: string): string[] => {
    if (!subjectName || !data[subjectName]) return []
    
    const subjectData = data[subjectName]
    
    // Xử lý ROB có cấu trúc đặc biệt
    if (subjectName === "Robotics (ROB)" && 'ROB' in subjectData) {
      return Object.keys((subjectData as any).ROB || {})
    }
    
    // Các môn khác
    return Object.keys(subjectData)
  }


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
  }, [selectedSubject])

  // Update selectedLesson when level or lessonNumber changes
  useEffect(() => {
    if (selectedLevel && lessonNumber) {
      const lessonKey = `lesson_${lessonNumber}`
      setSelectedLesson(lessonKey)
    }
  }, [selectedLevel, lessonNumber])

  // Load lesson data when selectedSubject, selectedLevel and selectedLesson change
  useEffect(() => {
    if (selectedSubject && selectedLevel && selectedLesson) {
      const subjectData = data[selectedSubject]
      let levelData: { [lessonKey: string]: LessonData } | undefined
      
      // Xử lý ROB có cấu trúc đặc biệt
      if (selectedSubject === "Robotics (ROB)") {
        const robData = subjectData as { ROB?: { [levelKey: string]: { [lessonKey: string]: LessonData } } }
        if (robData.ROB && robData.ROB[selectedLevel]) {
          levelData = robData.ROB[selectedLevel]
        }
      } else {
        // Các môn khác
        const normalData = subjectData as SubjectData
        if (normalData[selectedLevel]) {
          levelData = normalData[selectedLevel]
        }
      }
      
      const lessonData = levelData?.[selectedLesson] as LessonData | undefined
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
  }, [selectedSubject, selectedLevel, selectedLesson])

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
    if (selectedSubject && selectedLevel) {
      // Xử lý ROB có cấu trúc đặc biệt
      if (selectedSubject === "Robotics (ROB)") {
        if (!output[selectedSubject]) {
          output[selectedSubject] = { ROB: {} }
        }
        if (!output[selectedSubject].ROB[selectedLevel]) {
          output[selectedSubject].ROB[selectedLevel] = {}
        }
        output[selectedSubject].ROB[selectedLevel][selectedLesson] = formData
      } else {
        if (!output[selectedSubject]) {
          output[selectedSubject] = {}
        }
        if (!output[selectedSubject][selectedLevel]) {
          output[selectedSubject][selectedLevel] = {}
        }
        output[selectedSubject][selectedLevel][selectedLesson] = formData
      }
    }
    setResult(JSON.stringify(output, null, 2))
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Quản Lý Bài Học</h1>
      </div>

      {/* Subject, Level and Lesson Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject và Level với Accordion */}
        <div className="space-y-2">
          <Label>Môn học:</Label>
          <div className="border rounded-md p-2">
            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              value={openAccordion}
              onValueChange={(value) => {
                setOpenAccordion(value || "")
                if (value) {
                  setSelectedSubject(value)
                  const levels = getLevelsForSubject(value)
                  if (levels.length > 0 && !levels.includes(selectedLevel)) {
                    setSelectedLevel(levels[0])
                  }
                }
              }}
            >
              {subjects.map((subject) => {
                const levels = getLevelsForSubject(subject)
                const isSelected = selectedSubject === subject
                const isOpen = openAccordion === subject
                
                return (
                  <AccordionItem 
                    key={subject} 
                    value={subject} 
                    className="border-none"
                  >
                    <div
                      onMouseEnter={() => {
                        if (!isOpen) {
                          setOpenAccordion(subject)
                          setSelectedSubject(subject)
                          const levels = getLevelsForSubject(subject)
                          if (levels.length > 0 && !levels.includes(selectedLevel)) {
                            setSelectedLevel(levels[0])
                          }
                        }
                      }}
                    >
                      <AccordionTrigger className="py-2 hover:no-underline [&>svg]:hidden">
                        <div className="flex items-center gap-2 w-full">
                          <ChevronRight 
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isOpen ? 'rotate-90' : ''
                            }`}
                          />
                          <span className={isSelected ? 'font-semibold' : ''}>{subject}</span>
                          {isSelected && selectedLevel && (
                            <span className="ml-auto text-sm text-muted-foreground">
                              → {selectedLevel}
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <div className="pl-6 space-y-1">
                        {levels.map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSubject(subject)
                              setSelectedLevel(level)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedSubject === subject && selectedLevel === level
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
          {selectedSubject && selectedLevel && (
            <div className="text-sm text-muted-foreground mt-2">
              Level: <span className="font-medium">{selectedLevel}</span>
            </div>
          )}
        </div>

        {/* Lesson Number */}
        <div className="space-y-2">
          <Label htmlFor="lessonNumber">Số bài học:</Label>
          <div className="flex items-center gap-2">
            <Input
              id="lessonNumber"
              type="number"
              min="1"
              max="14"
              value={lessonNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 1
                setLessonNumber(Math.max(1, Math.min(14, num)))
                if (selectedLevel) {
                  setSelectedLesson(`lesson_${num}`)
                }
              }}
              className="flex-1"
              disabled={!selectedLevel}
            />
            <div className="flex flex-col">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-4 w-8 rounded-b-none"
                onClick={() => handleLessonNumberChange(1)}
                disabled={!selectedLevel}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-4 w-8 rounded-t-none border-t-0"
                onClick={() => handleLessonNumberChange(-1)}
                disabled={!selectedLevel}
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
