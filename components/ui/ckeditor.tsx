"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { useEffect } from "react"
import { Button } from "./button"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link as LinkIcon,
  Palette,
  Highlighter,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface CKEditorProps {
  value: string
  onChange: (data: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CKEditor({ value, onChange, placeholder, disabled, className }: CKEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Underline,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
        'data-placeholder': placeholder || '',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div className={`min-h-[200px] border rounded-md p-4 ${className || ''}`}>
        <div className="text-muted-foreground">Đang tải editor...</div>
      </div>
    )
  }

  return (
    <div className={`border rounded-md overflow-hidden ${className || ''}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={disabled}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Màu chữ"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-3">
              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Màu chữ</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#000000', '#ffffff', 'rgb(219, 52, 46)', 'rgb(242, 120, 6)', 'rgb(247, 181, 3)', 'rgb(21, 168, 95)'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run()
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    type="color"
                    onChange={(e) => {
                      editor.chain().focus().setColor(e.target.value).run()
                    }}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    className="h-8 w-full cursor-pointer rounded border"
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    disabled={disabled}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Màu nền"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-3">
              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Màu nền</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#fef08a', '#fde047', '#facc15', '#fbbf24', '#f59e0b', '#f97316', '#fb7185', '#f472b6', '#a78bfa', '#818cf8', '#60a5fa', '#34d399'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run()
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    type="color"
                    onChange={(e) => {
                      editor.chain().focus().toggleHighlight({ color: e.target.value }).run()
                    }}
                    value="#ffff00"
                    className="h-8 w-full cursor-pointer rounded border"
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                    disabled={disabled}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            disabled={disabled}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            disabled={disabled}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            disabled={disabled}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('link') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              const url = window.prompt('Nhập URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            disabled={disabled}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[400px] bg-background">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 400px;
          padding: 1rem;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ProseMirror mark {
          background-color: yellow;
          padding: 2px 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
