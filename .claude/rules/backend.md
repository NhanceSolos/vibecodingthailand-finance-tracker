---
scope: apps/backend/**
---

# Backend Rules

## Architecture

- ทุก feature เป็น NestJS module แยก
- Flow: Controller (validate) → Service (business logic) → Repo (DB)
- DB access ผ่าน Repo ที่ wrap Prisma client เท่านั้น ห้ามเรียก Prisma ตรงใน Service

## Contracts

- Input validation: import DTO class จาก `packages/shared` มาใช้โดยตรง ห้ามสร้าง DTO ซ้ำใน backend
- Response ที่ส่งกลับ frontend ต้องตรงกับ response type ใน `packages/shared`

## Security & Errors

- Auth: JWT Guard
- Error handling: NestJS built-in exceptions

## Testing

- ทุก service ต้องมี unit test (happy path + error case)
- Test file วางข้างๆ source: `*.service.ts` → `*.service.spec.ts`

## Pre-commit (apps/backend)

ก่อน commit ที่แก้ใน `apps/backend`:

1. Build ต้องผ่าน
2. รัน test เฉพาะ `*.service.spec.ts` ที่เกี่ยวข้อง (ไม่ต้องรันทุกไฟล์)
3. ถ้า fail ให้ fix ก่อนแล้วค่อย commit
