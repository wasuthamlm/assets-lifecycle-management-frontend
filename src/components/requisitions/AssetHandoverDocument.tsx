import { RequestType } from '@/api/types/common.types'
import { formatThaiDate } from '@/lib/formatters'

export interface AssetHandoverDocumentItem {
  seq: number
  name: string
  brand: string
  model: string
  serialNumber: string
  note: string
}

export interface AssetHandoverDocumentAccessories {
  adapter?: boolean
  mouse?: boolean
  pen?: boolean
  bag?: boolean
  other?: string | null
}

export interface AssetHandoverDocumentProps {
  companyName?: string
  requisitionNo: string
  requestType: RequestType
  documentDate: string | Date
  employeeName: string
  employeeNameEn?: string | null
  startDate?: string | null
  position?: string | null
  department?: string | null
  employeeCode?: string | null
  contactPhone?: string | null
  items: AssetHandoverDocumentItem[]
  accessories?: AssetHandoverDocumentAccessories | null
}

function Checkbox({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <span className="mr-4 inline-flex items-center gap-1.5">
      <span
        className={`flex h-4 w-4 items-center justify-center border text-[10px] leading-none ${checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-400 text-transparent'}`}
      >
        ✓
      </span>
      {label}
    </span>
  )
}

/**
 * เรนเดอร์ "ใบส่งมอบ-ส่งคืน ทรัพย์สินของบริษัท" ให้ตรงกับฟอร์มกระดาษต้นฉบับ — ใช้ทั้งใน
 * modal ตัวอย่างเอกสารตอนสร้างคำขอ (RequisitionForm) และหน้าดูเอกสารหลังบันทึกแล้ว (RequisitionDetailPage)
 * เพื่อให้ผู้ใช้เห็นหน้าตาเดียวกันเป๊ะๆ ทั้งก่อนและหลังกดบันทึกคำขอ
 * พื้นขาว/ตัวหนังสือเข้มคงที่เสมอ ไม่ตามธีมมืด เพราะเป็นตัวอย่างเอกสารพิมพ์
 */
export function AssetHandoverDocument({
  companyName = 'บริษัท มิลลิเมด จำกัด',
  requisitionNo,
  requestType,
  documentDate,
  employeeName,
  employeeNameEn,
  startDate,
  position,
  department,
  employeeCode,
  contactPhone,
  items,
  accessories,
}: AssetHandoverDocumentProps) {
  const rows = items.length > 0 ? items : [{ seq: 1, name: '', brand: '', model: '', serialNumber: '', note: '' }]

  return (
    <div className="min-h-[297mm] w-[210mm] max-w-none bg-white p-12 text-slate-900 shadow-xl">
      <h2 className="text-center text-lg font-bold">ใบส่งมอบ - ส่งคืน ทรัพย์สินของบริษัท</h2>
      <p className="text-center text-base font-semibold">{companyName}</p>
      <p className="mt-3 text-right text-sm">วันที่ {formatThaiDate(documentDate)}</p>

      <div className="mt-4 grid grid-cols-2 gap-y-1.5 text-sm">
        <div>ชื่อ-นามสกุล ผู้รับทรัพย์สิน : {employeeName}</div>
        <div>เบอร์ติดต่อ : {contactPhone || '-'}</div>
        <div>ชื่อ-นามสกุล ผู้รับทรัพย์สิน (ภาษาอังกฤษ) : {employeeNameEn || '-'}</div>
        <div />
        <div>
          วันที่เริ่มงาน : {startDate ? formatThaiDate(startDate) : '-'} ตำแหน่ง : {position || '-'}
        </div>
        <div>ฝ่าย : {department || '-'}</div>
        <div className="col-span-2">รหัสพนักงาน : {employeeCode || '-'}</div>
        <div className="col-span-2">
          เลขที่เอกสาร : {requisitionNo} ({requestType === RequestType.BORROW ? 'ยืม' : 'เบิก'})
        </div>
      </div>

      <p className="mt-4 text-sm underline decoration-slate-400 underline-offset-2">
        รายการทรัพย์สินที่บริษัทให้ไว้เพื่อใช้ในการทำงานให้แก่บริษัท ซึ่งถือเป็นรายการทรัพย์สินที่พนักงานต้องรับผิดชอบในระหว่างการทำงาน
      </p>

      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-300 px-2 py-1.5">ลำดับที่</th>
            <th className="border border-slate-300 px-2 py-1.5">รายการ</th>
            <th className="border border-slate-300 px-2 py-1.5">ยี่ห้อ</th>
            <th className="border border-slate-300 px-2 py-1.5">รุ่น</th>
            <th className="border border-slate-300 px-2 py-1.5">หมายเลขเครื่อง</th>
            <th className="border border-slate-300 px-2 py-1.5">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.seq}>
              <td className="border border-slate-300 px-2 py-1.5 text-center">{item.seq}</td>
              <td className="border border-slate-300 px-2 py-1.5">{item.name}</td>
              <td className="border border-slate-300 px-2 py-1.5">{item.brand || '-'}</td>
              <td className="border border-slate-300 px-2 py-1.5">{item.model || '-'}</td>
              <td className="border border-slate-300 px-2 py-1.5">{item.serialNumber || '-'}</td>
              <td className="border border-slate-300 px-2 py-1.5">{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex flex-wrap items-center text-sm">
        <span className="mr-3 font-medium">อุปกรณ์ต่อพ่วง :</span>
        <Checkbox checked={accessories?.adapter} label="Adapter" />
        <Checkbox checked={accessories?.mouse} label="Mouse" />
        <Checkbox checked={accessories?.pen} label="Pen" />
        <Checkbox checked={accessories?.bag} label="กระเป๋า" />
        <Checkbox checked={!!accessories?.other} label={`อื่นๆ ${accessories?.other || ''}`} />
      </div>

      <div className="mt-4 text-xs leading-relaxed">
        <p className="underline decoration-slate-400 underline-offset-2">ข้อกำหนดการรักษาและใช้ทรัพย์สินของบริษัท</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4">
          <li>พนักงานจะต้องใช้งานและดูแลทรัพย์สินของบริษัทอย่างเหมาะสม ไม่ให้เกิดการชำรุดเสียหาย หรือสูญหาย หากเกิดความเสียหายจากการใช้งานพนักงานจะต้องรับผิดชอบและชดใช้ทุกกรณี</li>
          <li>
            กรณีทรัพย์สินประเภทอุปกรณ์อิเล็กทรอนิกส์ หรือเครื่องมือสื่อสารใดๆ
            <ol className="mt-1 list-[lower-alpha] space-y-1 pl-4">
              <li>หากพนักงานประสงค์จะติดตั้งโปรแกรมเพิ่มเติมต้องแจ้งให้ฝ่าย IT เป็นผู้ดำเนินการให้</li>
              <li>
                พนักงานจะต้องรักษาและดูแลข้อมูลที่อยู่ภายในอุปกรณ์ หากเกิดความเสียหายจากการใช้งาน
                หรือเกิดความไม่ปลอดภัยหรือไม่ถูกต้องตามกฎหมายของข้อมูล เช่น การใช้ software ละเมิดลิขสิทธิ์
                การนำเข้าข้อมูลอันเป็นเท็จหรือผิดกฎหมาย พนักงานจะเป็นผู้รับผิดชอบและชดใช้ความเสียหายในทุกกรณี
              </li>
            </ol>
          </li>
          <li>
            เมื่อสิ้นสุดการใช้งาน หรือเมื่อสิ้นสุดสถานการเป็นพนักงานของบริษัทไม่ว่าด้วยเหตุใด พนักงานต้องส่งทรัพย์สินทั้งหมดคืนบริษัททันที
            และพนักงานจะต้องส่งคืนทรัพย์สินในสภาพที่ใช้การได้เรียบร้อย หากเกิดการชำรุดเสียหาย หรือใช้การไม่ได้ หรือสูญหาย
            พนักงานจะต้องซ่อมแซมให้คงสภาพเดิมโดยค่าใช้จ่ายของตนเอง หรือชดใช้คืนเป็นทรัพย์สิน โดยใช้ยี่ห้อเดิมหรือเทียบเคียง
            ประเภท ชนิด ขนาด ลักษณะ และคุณภาพอย่างเดียวกัน หรือชดใช้เป็นเงินตามราคาที่เป็นอยู่ในขณะรับทรัพย์สิน
          </li>
          <li>ห้ามผู้ใช้งานนำข้อมูลในแท็บเล็ตเผยแพร่ต่อ บริษัทคู่แข่ง หรือบุคลากรที่เกี่ยวข้องกับบริษัทคู่แข่ง</li>
        </ol>
      </div>

      <div className="mt-4 grid grid-cols-2 border border-slate-300 text-xs">
        <div className="border-r border-slate-300 p-3">
          <p className="font-semibold">ช่องสำหรับรับมอบทรัพย์สิน</p>
          <p className="mt-2 font-medium">พนักงาน/ผู้รับมอบทรัพย์สิน :</p>
          <p className="mt-1">
            ข้าพเจ้าขอรับรองว่าได้รับทรัพย์สินตามรายการข้างต้นไว้ครบถ้วนแล้วและจะนำส่งคืนทรัพย์สินให้ตรงตามเวลาที่กำหนด
            และปฏิบัติตามข้อกำหนดการรักษาและใช้ทรัพย์สินของบริษัทอย่างเคร่งครัด
          </p>
          <p className="mt-8 border-t border-dotted border-slate-400 pt-1">(ลงลายมือชื่อ) {employeeName}</p>
          <p className="mt-4 font-medium">ผู้ส่งมอบทรัพย์สิน :</p>
          <p className="mt-8 border-t border-dotted border-slate-400 pt-1">(ลงลายมือชื่อ)</p>
          <p className="mt-4 font-medium">พยาน : ฝ่ายบุคคล</p>
          <p className="mt-8 border-t border-dotted border-slate-400 pt-1">(ลงลายมือชื่อ)</p>
        </div>
        <div className="p-3">
          <p className="font-semibold">ช่องสำหรับส่งคืนทรัพย์สิน</p>
          <p className="mt-2 font-medium">พนักงาน/ผู้ส่งคืนทรัพย์สิน :</p>
          <p className="mt-8 border-t border-dotted border-slate-400 pt-1">(ลงลายมือชื่อ)</p>
          <p className="mt-4 font-medium">สภาพทรัพย์สินที่ส่งคืน</p>
          <p className="mt-1">{'☐'} ใช้งานได้, สภาพสมบูรณ์, อุปกรณ์ต่อพ่วงครบ (ถ้ามี)</p>
          <p>{'☐'} ชำรุด, ใช้งานไม่ได้, สูญหาย, อุปกรณ์ไม่ครบ</p>
          <p className="mt-4 font-medium">ผู้ตรวจรับคืนทรัพย์สิน :</p>
          <p className="mt-8 border-t border-dotted border-slate-400 pt-1">(ลงลายมือชื่อ)</p>
          <p className="mt-4 font-medium">พยาน : ฝ่ายบุคคล</p>
          <p className="mt-8 border-t border-dotted border-slate-400 pt-1">(ลงลายมือชื่อ)</p>
        </div>
      </div>
    </div>
  )
}
