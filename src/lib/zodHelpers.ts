import { z } from 'zod'

// react-hook-form กับ <Select>/<Input type="number"> ที่ไม่ได้กรอกจะส่งค่าเป็น '' เข้ามา
// z.coerce.number() จะแปลง '' เป็น 0 ซึ่งไปชน .positive() ทำให้ optional field ที่เว้นว่างไว้ validate ไม่ผ่าน
// preprocess ตรงนี้แปลง '' / undefined / null ให้เป็น undefined ก่อน เพื่อให้ .optional() ทำงานถูกต้อง
function emptyToUndefined(val: unknown) {
  return val === '' || val === undefined || val === null ? undefined : val
}

export function optionalPositiveInt(message?: string) {
  return z.preprocess(emptyToUndefined, z.coerce.number().int().positive(message).optional())
}

export function optionalNonNegativeNumber(message?: string) {
  return z.preprocess(emptyToUndefined, z.coerce.number().nonnegative(message).optional())
}

// <Input type="date"> ที่ไม่ได้กรอกจะส่ง '' — backend ใช้ @IsDateString() @IsOptional()
// ซึ่ง @IsOptional เช็คแค่ null/undefined เท่านั้น ส่ง '' ไปจะ validate ไม่ผ่านที่ backend (400)
export function optionalDateString() {
  return z.preprocess(emptyToUndefined, z.string().optional())
}
