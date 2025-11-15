"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"

interface SubjectLevelSelectorProps {
  subjects: string[]
  selectedSubject: string
  selectedLevel: string
  onSubjectChange: (subject: string) => void
  onLevelChange: (subject: string, level: string) => void
  getSubjectName: (code: string) => string
  getLevelsForSubject: (code: string) => string[]
  label?: string
}

export function SubjectLevelSelector({
  subjects,
  selectedSubject,
  selectedLevel,
  onSubjectChange,
  onLevelChange,
  getSubjectName,
  getLevelsForSubject,
  label = "Môn học và Level:"
}: SubjectLevelSelectorProps) {
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState<boolean>(false)
  const [hoveredSubject, setHoveredSubject] = useState<string>("")
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const submenuPositionedRef = useRef<Record<string, boolean>>({})

  // Reset positioned state khi dropdown đóng
  useEffect(() => {
    if (!isSubjectDropdownOpen) {
      submenuPositionedRef.current = {}
      setHoveredSubject("")
    }
  }, [isSubjectDropdownOpen])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {/* Subject Selector Button */}
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
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current)
                      hoverTimeoutRef.current = null
                    }
                    if (hasLevels) {
                      // Reset positioned state khi hover vào subject mới
                      submenuPositionedRef.current[subject] = false
                      setHoveredSubject(subject)
                    }
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      setHoveredSubject("")
                      submenuPositionedRef.current[subject] = false
                    }, 150)
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSubjectChange(subject)
                      if (hasLevels && levels.length > 0) {
                        onLevelChange(subject, levels[0])
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
                    <>
                      {/* Bridge vô hình để giữ submenu mở khi di chuyển chuột */}
                      <div
                        className="fixed bg-transparent"
                        style={{
                          zIndex: 99,
                          pointerEvents: 'auto'
                        }}
                        onMouseEnter={() => {
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current)
                            hoverTimeoutRef.current = null
                          }
                          setHoveredSubject(subject)
                        }}
                        onMouseLeave={() => {}}
                        ref={(bridgeEl) => {
                          if (bridgeEl && bridgeEl.parentElement) {
                            setTimeout(() => {
                              const subjectButton = bridgeEl.parentElement?.querySelector('button') as HTMLElement
                              if (!subjectButton) return
                              
                              const subjectButtonRect = subjectButton.getBoundingClientRect()
                              const viewportWidth = window.innerWidth
                              
                              let left = subjectButtonRect.right
                              let width = 12
                              let top = subjectButtonRect.top
                              let height = subjectButtonRect.height
                              
                              // Nếu submenu hiện bên trái, bridge cũng ở bên trái
                              if (subjectButtonRect.right + 300 > viewportWidth - 20) {
                                left = subjectButtonRect.left - 300 - 12
                              }
                              
                              bridgeEl.style.left = `${left}px`
                              bridgeEl.style.top = `${top}px`
                              bridgeEl.style.width = `${width}px`
                              bridgeEl.style.height = `${height}px`
                            }, 0)
                          }
                        }}
                      />
                      <div 
                        className="fixed min-w-[200px] max-w-[300px] border rounded-md bg-background shadow-lg transition-opacity duration-100"
                        style={{
                          maxHeight: 'calc(100vh - 200px)',
                          overflowY: 'auto',
                          zIndex: 100,
                          opacity: submenuPositionedRef.current[subject] ? 1 : 0,
                          pointerEvents: submenuPositionedRef.current[subject] ? 'auto' : 'none',
                          left: '-9999px',
                          top: '-9999px'
                        }}
                        onMouseEnter={() => {
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current)
                            hoverTimeoutRef.current = null
                          }
                          setHoveredSubject(subject)
                        }}
                        onMouseLeave={() => {
                          hoverTimeoutRef.current = setTimeout(() => {
                            setHoveredSubject("")
                            submenuPositionedRef.current[subject] = false
                          }, 150)
                        }}
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
                              
                              // Tính toán vị trí: bên phải của subject button với khoảng cách 8px
                              let left = subjectButtonRect.right + 8
                              // Top của submenu = top của subject button (để option đầu tiên ngang với subject item)
                              // Trừ đi chiều cao của header "Level" để option đầu tiên ngang với subject item
                              const headerHeight = el.querySelector('.text-xs.font-medium')?.getBoundingClientRect().height || 0
                              let top = subjectButtonRect.top - headerHeight
                              
                              // Nếu tràn ra ngoài màn hình bên phải, hiện bên trái
                              if (left + 300 > viewportWidth - 20) {
                                left = subjectButtonRect.left - 300 - 8
                              }
                              
                              // Điều chỉnh vị trí dọc nếu tràn ra ngoài màn hình
                              if (top + el.offsetHeight > viewportHeight - 20) {
                                top = viewportHeight - el.offsetHeight - 20
                              }
                              
                              el.style.left = `${left}px`
                              el.style.top = `${top}px`
                              
                              // Đánh dấu đã positioned và hiện submenu
                              submenuPositionedRef.current[subject] = true
                              el.style.opacity = '1'
                              el.style.pointerEvents = 'auto'
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
                                  onSubjectChange(subject)
                                  onLevelChange(subject, level)
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
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

