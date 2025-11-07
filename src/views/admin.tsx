"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Edit2, Trash2, Check } from "lucide-react"

interface LessonData {
  id: string
  sheetName: string
  lessonCount: number
  morningDescription: string
  classStatus: string
  slideLink: string
  videoLink: string
  homeworkResult: string
}

export default function Admin() {
  const [lessons, setLessons] = useState<LessonData[]>([])
  const [formData, setFormData] = useState<Partial<LessonData>>({
    sheetName: "",
    lessonCount: 1,
    morningDescription: "",
    classStatus: "",
    slideLink: "",
    videoLink: "",
    homeworkResult: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof LessonData) => {
    const value = field === "lessonCount" ? Number.parseInt(e.target.value) || 1 : e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      setLessons((prev) =>
        prev.map((lesson) => (lesson.id === editingId ? { ...lesson, ...(formData as Partial<LessonData>) } : lesson)),
      )
      setEditingId(null)
    } else {
      const newLesson: LessonData = {
        id: Date.now().toString(),
        sheetName: formData.sheetName || "",
        lessonCount: formData.lessonCount || 1,
        morningDescription: formData.morningDescription || "",
        classStatus: formData.classStatus || "",
        slideLink: formData.slideLink || "",
        videoLink: formData.videoLink || "",
        homeworkResult: formData.homeworkResult || "",
      }
      setLessons((prev) => [newLesson, ...prev])
    }

    setFormData({
      sheetName: "",
      lessonCount: 1,
      morningDescription: "",
      classStatus: "",
      slideLink: "",
      videoLink: "",
      homeworkResult: "",
    })
  }

  const handleEdit = (lesson: LessonData) => {
    setFormData(lesson)
    setEditingId(lesson.id)
  }

  const handleDelete = (id: string) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Quản Lý Bài Học</h1>
        <p className="text-muted-foreground">Tạo và quản lý bài học của bạn</p>
      </section>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Chỉnh Sửa Bài Học" : "Tạo Bài Học Mới"}
          </CardTitle>
          <CardDescription>Điền tất cả các thông tin dưới đây</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Row: Sheet Name and Lesson Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sheetName">Tên Sheet</Label>
                <Input
                  id="sheetName"
                  placeholder="VD: React Basics"
                  value={formData.sheetName || ""}
                  onChange={(e) => handleInputChange(e, "sheetName")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonCount">Số Bài Học</Label>
                <Input
                  id="lessonCount"
                  type="number"
                  min="1"
                  value={formData.lessonCount || 1}
                  onChange={(e) => handleInputChange(e, "lessonCount")}
                />
              </div>
            </div>

            {/* Detailed Fields */}
            <div className="space-y-2">
              <Label htmlFor="morningDescription">Nội Dung Buổi Tối</Label>
              <Textarea
                id="morningDescription"
                placeholder="Mô tả nội dung của buổi học..."
                value={formData.morningDescription || ""}
                onChange={(e) => handleInputChange(e, "morningDescription")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classStatus">Tình Hình Học Tập Của Lớp</Label>
              <Textarea
                id="classStatus"
                placeholder="Nhận xét về tình hình học tập của lớp..."
                value={formData.classStatus || ""}
                onChange={(e) => handleInputChange(e, "classStatus")}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slideLink">Link Slide</Label>
                <Input
                  id="slideLink"
                  placeholder="https://..."
                  value={formData.slideLink || ""}
                  onChange={(e) => handleInputChange(e, "slideLink")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoLink">Link Video</Label>
                <Input
                  id="videoLink"
                  placeholder="https://..."
                  value={formData.videoLink || ""}
                  onChange={(e) => handleInputChange(e, "videoLink")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeworkResult">Kết Quả Bài Tập Về Nhà</Label>
              <Textarea
                id="homeworkResult"
                placeholder="Nhận xét về kết quả bài tập của học viên..."
                value={formData.homeworkResult || ""}
                onChange={(e) => handleInputChange(e, "homeworkResult")}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setFormData({
                      sheetName: "",
                      lessonCount: 1,
                      morningDescription: "",
                      classStatus: "",
                      slideLink: "",
                      videoLink: "",
                      homeworkResult: "",
                    })
                  }}
                >
                  Hủy
                </Button>
              )}
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                {editingId ? "Cập Nhật" : "Tạo Mới"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Danh Sách Bài Học</h2>
        <div className="space-y-3">
          {lessons.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Chưa có bài học nào. Tạo bài học mới để bắt đầu.
              </CardContent>
            </Card>
          ) : (
            lessons.map((lesson) => (
              <Card key={lesson.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{lesson.sheetName}</CardTitle>
                      <CardDescription>{lesson.lessonCount} bài học</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(lesson.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {lesson.morningDescription && (
                    <div>
                      <p className="font-semibold text-foreground">Nội Dung Buổi Tối:</p>
                      <p className="text-muted-foreground">{lesson.morningDescription}</p>
                    </div>
                  )}
                  {lesson.classStatus && (
                    <div>
                      <p className="font-semibold text-foreground">Tình Hình Học Tập:</p>
                      <p className="text-muted-foreground">{lesson.classStatus}</p>
                    </div>
                  )}
                  {(lesson.slideLink || lesson.videoLink) && (
                    <div className="flex gap-3">
                      {lesson.slideLink && (
                        <a
                          href={lesson.slideLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          Xem Slide
                        </a>
                      )}
                      {lesson.videoLink && (
                        <a
                          href={lesson.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          Xem Video
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
