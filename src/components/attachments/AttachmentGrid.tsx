import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Trash2, Upload } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'
import type { Attachment } from '@/api/types/attachment.types'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const ACCEPTED_TYPES_ATTR = ACCEPTED_TYPES.join(',')
// Chromium บน Windows บางเครื่อง/บางเวอร์ชัน sniff File.type ไม่ได้ตอนลากไฟล์วาง (drag-and-drop) ทำให้ได้
// file.type เป็นค่าว่าง '' ทั้งที่เลือกไฟล์เดียวกันผ่านไดอะล็อก <input type=file> แล้วได้ type ถูกต้องปกติ —
// ผลคือลากไฟล์รูปวางแล้วโดนปฏิเสธเพราะดูเหมือนไม่รองรับ ทั้งที่ไฟล์ถูกต้อง จึง fallback ไปเดาจากนามสกุลไฟล์
// เฉพาะตอน type ว่างเท่านั้น (ไม่ใช้แทนที่ type ที่ browser ให้มาแล้ว เผื่อไฟล์ผิดชนิดจริงๆ ต้องโดนกันเหมือนเดิม)
const EXTENSION_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

function resolveMimeType(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  return (ext && EXTENSION_TO_MIME[ext]) || ''
}
// ยังไม่มีเอกสารระบุ limit จาก backend — ตั้งไว้ 10MB ฝั่ง client ก่อนกันไฟล์ใหญ่เกินจริงหลุดไปถึง
// ขั้นอัปโหลดแล้วค่อยพัง ต้องยืนยันตัวเลขจริงกับ backend อีกทีตอน deploy
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function filterValidFiles(files: File[]): File[] {
  const valid: File[] = []
  for (const file of files) {
    const mimeType = resolveMimeType(file)
    if (!ACCEPTED_TYPES.includes(mimeType)) {
      toast.error(`ไม่รองรับไฟล์ "${file.name}" (รองรับเฉพาะ PNG, JPEG, WebP, PDF)`)
      continue
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`ไฟล์ "${file.name}" ใหญ่เกินไป (จำกัดไม่เกิน ${formatFileSize(MAX_FILE_SIZE_BYTES)})`)
      continue
    }
    // file.type ว่าง (ดูคอมเมนต์ที่ resolveMimeType) ต้อง re-wrap ด้วย type ที่เดาได้ก่อนส่งต่อ ไม่งั้น
    // FormData จะยังใช้ file.type เดิม (ว่าง) ตั้ง Content-Type ของไฟล์ตอนอัปโหลดจริง แล้วโดน backend
    // fileFilter (ALLOWED_ATTACHMENT_MIME_TYPES) ปฏิเสธซ้ำอีกชั้นที่ server อยู่ดี
    valid.push(file.type ? file : new File([file], file.name, { type: mimeType }))
  }
  return valid
}

interface AttachmentGridProps {
  title?: string
  attachments: Attachment[]
  isLoading: boolean
  canManage: boolean
  isUploading: boolean
  uploadProgress: number | null
  /** เรียกทีละไฟล์ — ผู้เรียก (AttachmentsPanel ฯลฯ) เป็นคนจัดคิวอัปโหลดทีละไฟล์เอง */
  onUpload: (file: File) => void
  onDelete: (id: number) => void
}

/** ส่วนแสดงผล/อัปโหลด/ลบไฟล์แนบล้วนๆ ไม่ผูกกับ endpoint ไหนโดยเฉพาะ — ผู้เรียก (AttachmentsPanel /
 * RequisitionAttachmentsPanel) เป็นคนตัดสินใจว่าจะดึง/อัปโหลด/ลบผ่าน endpoint ไหน และใครมีสิทธิ์ canManage
 * รองรับแนบได้หลายไฟล์ต่อครั้ง ทั้งเลือกจากไดอะล็อก (multiple) และลากวาง — คิวอัปโหลดทีละไฟล์เรียงกัน */
export function AttachmentGrid({
  title = 'ไฟล์แนบ / รูปภาพ',
  attachments,
  isLoading,
  canManage,
  isUploading,
  uploadProgress,
  onUpload,
  onDelete,
}: AttachmentGridProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queueRef = useRef<File[]>([])
  const [queueTotal, setQueueTotal] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  function enqueue(files: File[]) {
    const valid = filterValidFiles(files)
    if (valid.length === 0) return
    const wasEmpty = queueRef.current.length === 0
    queueRef.current.push(...valid)
    setQueueTotal((t) => t + valid.length)
    if (wasEmpty && !isUploading) {
      uploadNext()
    }
  }

  const uploadNext = useCallback(() => {
    const next = queueRef.current.shift()
    if (!next) {
      setQueueTotal(0)
      return
    }
    onUpload(next)
  }, [onUpload])

  // onUpload เป็น fire-and-forget (mutate ไม่ใช่ mutateAsync) เราจึงรอ isUploading ตกกลับเป็น false
  // (upload เสร็จ/พัง) แล้วค่อยดึงไฟล์ถัดไปในคิวมาอัปโหลดต่อ — ต้องอยู่ใน effect ไม่ใช่ตอน render
  const prevUploadingRef = useRef(isUploading)
  useEffect(() => {
    if (prevUploadingRef.current && !isUploading) {
      if (queueRef.current.length > 0) {
        uploadNext()
      } else {
        setQueueTotal(0)
      }
    }
    prevUploadingRef.current = isUploading
  }, [isUploading, uploadNext])

  const queueRemaining = queueRef.current.length + (isUploading ? 1 : 0)
  const queuePosition = queueTotal - queueRemaining + 1

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    enqueue(files)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (!canManage) return
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length === 0) return
    enqueue(files)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (!canManage) return
    dragCounter.current += 1
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  return (
    <Section
      title={title}
      action={
        canManage && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES_ATTR}
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} />
              {isUploading ? `กำลังอัปโหลด${queueTotal > 1 ? ` (${queuePosition}/${queueTotal})` : '...'}` : 'แนบไฟล์'}
            </Button>
          </>
        )
      }
    >
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          canManage && 'rounded-xl',
          isDragging && canManage && 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900',
        )}
      >
        {isUploading && uploadProgress != null && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        {isLoading ? (
          <Spinner />
        ) : attachments.length === 0 ? (
          canManage ? (
            <div
              className={cn(
                'flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed text-sm text-slate-400 transition-colors',
                isDragging ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-500/5' : 'border-slate-200 dark:border-slate-700',
              )}
            >
              ยังไม่มีไฟล์แนบ — ลากไฟล์มาวาง หรือกด "แนบไฟล์"
            </div>
          ) : (
            <p className="text-sm text-slate-400">ยังไม่มีไฟล์แนบ</p>
          )
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((a) => {
              const isImage = a.mimeType?.startsWith('image/')
              return (
                <li
                  key={a.attachmentId}
                  className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <a href={a.fileUrl} target="_blank" rel="noreferrer" className="block">
                    {isImage ? (
                      <img src={a.fileUrl} alt={a.fileName} className="h-24 w-full object-cover" />
                    ) : (
                      <div className="flex h-24 w-full flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800">
                        <FileText size={22} className="text-slate-400" />
                      </div>
                    )}
                    <div className="truncate p-2 text-xs text-slate-600 dark:text-slate-300">
                      {a.fileName}
                      <span className="block text-slate-400">{formatFileSize(a.fileSizeBytes)}</span>
                    </div>
                  </a>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onDelete(a.attachmentId)}
                      className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1 text-slate-500 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 dark:bg-slate-900/90"
                      aria-label="ลบไฟล์แนบ"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Section>
  )
}
