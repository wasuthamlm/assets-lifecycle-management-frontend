import { useMemo, useState } from 'react'
import {
  BatteryCharging,
  Cable,
  Check,
  Headphones,
  Info,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Package,
  Plus,
  Printer,
  Smartphone,
  Tablet,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { requiresHrRequest } from '@/lib/requiresHrRequest'
import { cn } from '@/lib/utils'
import type { Asset } from '@/api/types/asset.types'

interface AssetPickerProps {
  /** ทรัพย์สินที่ว่างให้เบิก/ยืม (in_stock) */
  assets: Asset[]
  /** assetId ที่อยู่ในใบขอแล้ว เรียงตามแถวของฟอร์ม */
  value: number[]
  onAdd: (assetId: number) => void
  onRemove: (index: number) => void
  onReplace: (index: number, assetId: number) => void
  /** HR / IT (requisition.create_on_behalf) — เลือกของหมวดที่ต้องให้ HR เบิกให้ได้ และเลือกเครื่อง (S/N) เองได้ */
  canRequestOnBehalf: boolean
}

interface ModelGroup {
  key: string
  name: string
  units: Asset[]
}

interface CategoryGroup {
  name: string
  hrOnly: boolean
  models: ModelGroup[]
}

// ไอคอนตามชื่อหมวดหมู่ — หมวดไหนไม่เข้าเงื่อนไขใช้รูปกล่อง
const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/notebook|laptop|โน้ตบุ๊ก|โน๊ตบุ๊ค/i, Laptop],
  [/tablet|ipad|แท็บเล็ต/i, Tablet],
  [/keyboard|คีย์บอร์ด/i, Keyboard],
  [/mouse|เมาส์/i, Mouse],
  [/ชาร์จ|charger|adapter|power|battery/i, BatteryCharging],
  [/monitor|จอ/i, Monitor],
  [/headset|headphone|หูฟัง/i, Headphones],
  [/printer|ปริ้น|พิมพ์/i, Printer],
  [/phone|มือถือ|โทรศัพท์/i, Smartphone],
  [/ต่อพ่วง|hub|สาย|cable|usb/i, Cable],
]
function categoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS.find(([re]) => re.test(name))?.[1] ?? Package
}

// ชื่อที่ผู้ใช้เห็น: ชื่อทรัพย์สิน + ยี่ห้อ/รุ่น เฉพาะส่วนที่ชื่อยังไม่มี (กัน "จอภาพ LG 24 นิ้ว LG ...")
function displayName(a: Asset): string {
  const parts = [a.assetName]
  for (const extra of [a.brand, a.model]) {
    if (extra && !parts.join(' ').toLowerCase().includes(extra.toLowerCase())) parts.push(extra)
  }
  return parts.join(' ')
}
const modelKey = (a: Asset) => [a.assetName, a.brand, a.model].join('|')
const serialOf = (a: Asset) => a.serialNumber ?? `ไม่มี S/N (#${a.assetId})`

// หมายเหตุของรุ่น: ทุกเครื่องเหมือนกันโชว์ครั้งเดียว ไม่ต้องซ้ำทุกแถวเหมือน dropdown เดิม
function modelNote(units: Asset[]): string | null {
  const notes = [...new Set(units.map((u) => u.notes?.trim() || ''))]
  if (notes.length === 1) return notes[0] || null
  return 'สภาพแต่ละเครื่องต่างกัน'
}

// จัดกลุ่ม หมวดหมู่ → รุ่น (ชื่อ+ยี่ห้อ+รุ่นเดียวกัน) คงลำดับตามที่เจอครั้งแรก
function groupAssets(assets: Asset[]): CategoryGroup[] {
  const categories: CategoryGroup[] = []
  for (const asset of assets) {
    const catName = asset.category?.categoryName ?? 'อื่นๆ'
    let cat = categories.find((c) => c.name === catName)
    if (!cat) {
      cat = { name: catName, hrOnly: requiresHrRequest(asset), models: [] }
      categories.push(cat)
    }
    const key = modelKey(asset)
    let model = cat.models.find((m) => m.key === key)
    if (!model) {
      model = { key, name: displayName(asset), units: [] }
      cat.models.push(model)
    }
    model.units.push(asset)
  }
  return categories
}

/**
 * เลือกทรัพย์สินแบบ หมวด → รุ่น: ผู้ใช้ไม่ต้องไล่ดู S/N — กด "เลือก" แล้วระบบหยิบเครื่องว่างเครื่องแรกของรุ่นนั้นให้
 * HR / IT เปลี่ยนเป็นเครื่องที่ต้องการได้จากรายการที่เลือกไว้ (ทุกแถวยังเป็นทรัพย์สิน 1 เครื่องเหมือนเดิม)
 */
export function AssetPicker({ assets, value, onAdd, onRemove, onReplace, canRequestOnBehalf }: AssetPickerProps) {
  const categories = useMemo(() => groupAssets(assets), [assets])
  const byId = useMemo(() => new Map(assets.map((a) => [a.assetId, a])), [assets])
  const selected = new Set(value)
  // เปิดมาพร้อมของที่เลือกไว้แล้ว (เช่นกดจากหน้ารายการทรัพย์สิน) → เปิดหมวดของชิ้นนั้นไว้ให้
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    const first = value.length ? assets.find((a) => a.assetId === value[0]) : undefined
    return first?.category?.categoryName ?? null
  })
  const [expanded, setExpanded] = useState<number | null>(null)

  const isLocked = (cat: CategoryGroup) => cat.hrOnly && !canRequestOnBehalf
  const freeUnits = (units: Asset[]) => units.filter((u) => !selected.has(u.assetId))
  const active = categories.find((c) => c.name === activeCategory)

  if (categories.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">ตอนนี้ไม่มีทรัพย์สินว่างให้เบิก/ยืม</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">กดประเภทของที่ต้องการ แล้วเลือกรุ่น</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = categoryIcon(cat.name)
            const left = cat.models.reduce((sum, m) => sum + freeUnits(m.units).length, 0)
            const isActive = cat.name === activeCategory
            return (
              <button
                key={cat.name}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors duration-200',
                  isActive
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-brand-600 dark:text-brand-300',
                    isActive ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800',
                  )}
                >
                  <Icon size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-slate-800 dark:text-slate-100">{cat.name}</span>
                  {isLocked(cat) ? (
                    <span className="block text-xs text-amber-700 dark:text-amber-300">ให้ HR เบิกให้</span>
                  ) : (
                    <span className="block text-xs text-slate-500 dark:text-slate-400">เหลือ {left} ชิ้น</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {active && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{active.name} — เลือกรุ่น</p>
          {isLocked(active) ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <Info size={16} className="mt-0.5 shrink-0" />
              {active.name} ต้องให้ HR เป็นผู้ทำรายการเบิก/ยืมให้ กรุณาติดต่อ HR
            </div>
          ) : (
            <div className="space-y-2">
              {active.models.map((m) => {
                const free = freeUnits(m.units)
                const note = modelNote(m.units)
                return (
                  <div key={m.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{m.name}</p>
                      {note && <p className="text-sm text-slate-500 dark:text-slate-400">{note}</p>}
                    </div>
                    <span
                      className={cn(
                        'whitespace-nowrap text-sm font-medium tabular-nums',
                        free.length === 0 ? 'text-slate-400' : free.length <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {free.length === 0 ? 'เลือกครบแล้ว' : `เหลือ ${free.length}`}
                    </span>
                    <Button type="button" size="sm" disabled={free.length === 0} onClick={() => onAdd(free[0].assetId)}>
                      <Plus size={15} /> เลือก
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2 border-t border-dashed border-slate-300 pt-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">ที่เลือกไว้ ({value.length})</p>
          {value.map((assetId, idx) => {
            const asset = byId.get(assetId)
            if (!asset) return null
            const sameModel = assets.filter((a) => modelKey(a) === modelKey(asset) && (a.assetId === assetId || !selected.has(a.assetId)))
            const canChange = canRequestOnBehalf && sameModel.length > 1
            const isOpen = expanded === idx
            return (
              <div key={`${assetId}-${idx}`} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <Check size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {displayName(asset)}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      S/N {serialOf(asset)}
                      {canChange && (
                        <>
                          {' · '}
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : idx)}
                            className="text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-400"
                          >
                            {isOpen ? 'ปิด' : 'เลือกเครื่องเอง'}
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`เอา ${asset.assetName} ออก`}
                    onClick={() => {
                      setExpanded(null)
                      onRemove(idx)
                    }}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {isOpen && (
                  <div role="radiogroup" className="ml-8 mt-2 space-y-1">
                    {sameModel.map((u) => (
                      <label key={u.assetId} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 tabular-nums dark:text-slate-200">
                        <input
                          type="radio"
                          name={`asset-unit-${idx}`}
                          checked={u.assetId === assetId}
                          onChange={() => onReplace(idx, u.assetId)}
                          className="accent-brand-600"
                        />
                        S/N {serialOf(u)}
                        {u.notes && <span className="text-xs text-slate-400">· {u.notes}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
