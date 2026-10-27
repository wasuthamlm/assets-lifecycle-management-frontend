import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AssetHandoverDocument, type AssetHandoverDocumentProps } from '@/components/requisitions/AssetHandoverDocument'

// 210mm ที่ 96dpi ของ CSS — ความกว้างกระดาษ A4 ของ AssetHandoverDocument
const A4_WIDTH_PX = (210 * 96) / 25.4

// ย่อเนื้อหาความกว้างคงที่ (เช่นกระดาษ A4) ให้พอดีกับพื้นที่เมื่อจอแคบกว่า — จอกว้างพอแสดงขนาดจริง (ไม่ขยายเกิน 1)
// ใช้ CSS zoom แทน transform เพื่อให้ความสูงของ layout หดตามด้วย ไม่เหลือที่ว่างใต้กระดาษ
function FitToWidth({ contentWidthPx, children }: { contentWidthPx: number; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / contentWidthPx))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [contentWidthPx])

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  )
}

/**
 * ใบส่งมอบ-ส่งคืนทรัพย์สินสำหรับวางใน modal (size="a4") — แสดงกระดาษ A4 พอดีความกว้าง
 * และ portal สำเนาอีกชุดไว้ที่ <body> ให้ window.print() พิมพ์เฉพาะแผ่นเอกสาร (ดู .print-root ใน index.css)
 */
export function HandoverDocumentPreview(props: AssetHandoverDocumentProps) {
  return (
    <>
      <FitToWidth contentWidthPx={A4_WIDTH_PX}>
        <AssetHandoverDocument {...props} className="border border-slate-200 shadow-none" />
      </FitToWidth>
      {createPortal(
        <div className="print-root">
          {/* min-h-0 กันความสูง 297mm พอดีเป๊ะแล้วล้นไปขึ้นหน้าว่างหน้าที่ 2 ตอนพิมพ์ */}
          <AssetHandoverDocument {...props} className="min-h-0 shadow-none" />
        </div>,
        document.body,
      )}
    </>
  )
}
