"use client"

import { useEffect, useRef, useState } from "react"

interface CKEditorProps {
  value: string
  onChange: (data: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CKEditor({ value, onChange, placeholder, disabled, className }: CKEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !editorRef.current || editorInstanceRef.current) return

    let editorInstance: any = null

    // Dynamic import CKEditor để tránh lỗi SSR
    const initEditor = async () => {
      try {
        const ClassicEditor = (await import("@ckeditor/ckeditor5-build-classic")).default

        if (editorRef.current && !editorInstanceRef.current) {
          ClassicEditor
            .create(editorRef.current, {
              placeholder,
              ...(disabled && { isReadOnly: true }),
            })
            .then((editor: any) => {
              editorInstanceRef.current = editor
              editorInstance = editor

              // Set initial value
              if (value) {
                editor.setData(value)
              }

              // Listen to changes
              editor.model.document.on('change:data', () => {
                const data = editor.getData()
                onChange(data)
              })
            })
            .catch((error: any) => {
              console.error('Error initializing CKEditor:', error)
            })
        }
      } catch (error) {
        console.error('Error loading CKEditor:', error)
      }
    }

    initEditor()

    return () => {
      if (editorInstance) {
        editorInstance
          .destroy()
          .catch((error: any) => {
            console.error('Error destroying CKEditor:', error)
          })
        editorInstanceRef.current = null
      }
    }
  }, [isMounted, placeholder, disabled])

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorInstanceRef.current && value !== editorInstanceRef.current.getData()) {
      editorInstanceRef.current.setData(value || '')
    }
  }, [value])

  if (!isMounted) {
    return (
      <div className={`min-h-[200px] border rounded-md p-4 ${className || ''}`}>
        <div className="text-muted-foreground">Đang tải editor...</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={editorRef} className="ckeditor-wrapper" />
      <style jsx global>{`
        .ckeditor-wrapper {
          min-height: 400px;
        }
        .ckeditor-wrapper .ck-editor {
          min-height: 400px;
        }
        .ckeditor-wrapper .ck-editor__editable {
          min-height: 400px;
        }
        .ckeditor-wrapper .ck-editor__editable.ck-focused {
          border-color: hsl(var(--ring));
        }
        .dark .ckeditor-wrapper .ck-editor__editable {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .dark .ckeditor-wrapper .ck-toolbar {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
        }
        .ckeditor-wrapper .ck-content {
          min-height: 400px;
        }
      `}</style>
    </div>
  )
}

