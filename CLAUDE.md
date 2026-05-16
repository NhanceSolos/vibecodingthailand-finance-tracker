# Personal Finance Tracker

บันทึกรายจ่ายผ่าน LINE + Dashboard + AI auto-categorize

## Stack

- Monorepo: pnpm workspace
- Frontend: Vite + React + Tailwind (`apps/frontend`)
- Backend: NestJS (`apps/backend`)
- Database: Prisma + PostgreSQL (`packages/database`)
- Shared types: `packages/shared`
- External: LINE Messaging API, Claude API

## Architecture

- Backend ใช้ NestJS pattern: Module > Controller > Service > Repo
- DB access ผ่าน Repo ที่ wrap Prisma client เท่านั้น ห้ามเรียก Prisma ตรงใน Service
- Frontend: ใช้ Tailwind utility classes ห้าม inline style ห้าม CSS modules
## - `packages/shared`: DTO class (class-validator), Response interfaces, enum ข้าม wire — class-validator รันใน browser ได้ frontend เอาไป validate form ต่อใช้ได้เลย ไม่ต้องเขียน validation ซ้ำ
## - ห้ามเข้า `packages/shared`: class ที่ import จาก `@nestjs/*` (server-only), frontend-only view model / UI state
- API prefix: `/api`

### packages/shared

ใส่ได้:
- DTO class ที่ใช้ `class-validator` (รันใน browser ได้ frontend reuse ไป validate form ได้เลย)
- Response interfaces
- Enum ที่ข้าม wire ระหว่าง frontend/backend

ห้ามใส่:
- Class ที่ import จาก `@nestjs/*` (server-only)
- Frontend-only view model หรือ UI state

## Conventions

- TypeScript strict mode ทุก package
- ห้ามใช้ `any` type
- ห้ามใส่ comments ถ้าไม่ได้สั่ง โค้ดต้องอธิบายตัวเองด้วยชื่อตัวแปรและฟังก์ชันที่ชัดเจน
- `camelCase` variables/function, `PascalCase` types/Class, `kebab-case` files
- Indentation 2 spaces
- Error handling: NestJS built-in exceptions

## Testing

- Unit tests ใช้ Jest
- Test file อยู่ข้างๆ source: *.service.ts → *.service.spec.ts
- ทุก service ต้องมี test: happy path + error case

## Workflow

- 1 prompt = 1 commit
- ต้อง verify build ผ่านก่อน commit ทุกครั้ง
- Commit message ใช้ conventional commits (ภาษาอังกฤษ)
- Conventional commits: feat:, fix:, refactor:, test:, chore:
