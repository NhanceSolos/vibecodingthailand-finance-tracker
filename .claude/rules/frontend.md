---
scope: apps/frontend/**
---

# Frontend Rules

## Core

- Tailwind utility classes เท่านั้น ห้าม CSS modules ห้าม inline style
- Function components + hooks ห้าม class components
- React Router สำหรับ routing
- State ใช้ React hooks (`useState`, `useReducer`)
- API calls ใช้ fetch wrapper จาก `src/lib/api.ts`
- Pages อยู่ใน `src/pages/`
- Components อยู่ใน `src/components/`
- UI pattern ที่ใช้ซ้ำ (card, button, input, modal) ต้อง extract เป็น reusable component
- ที่ `src/components/ui/` ตั้งชื่อ PascalCase ห้าม copy-paste โครงเดิมข้ามหน้า

## Design System (Premium Dark Theme)

- Base: dark-only, `bg-zinc-950` page / `bg-zinc-900` cards / `bg-zinc-800` nested, `text-zinc-100` เป็น default
- Palette: zinc เป็น neutral + accent สีเดียว (emerald หรือ cyan) เฉพาะ CTA + highlight
- Semantic: รายรับ `emerald-500` / รายจ่าย `rose-500` / balance accent
- Typography: body Sarabun, heading Kanit (Google Fonts) heading หนาตัดคม hierarchy ชัด
- Cards: `rounded-xl` + `border border-zinc-800` + `active:scale-95` feedback
- Buttons: `hover:scale-[1.02]` + `transition` + `active:scale-95` feedback
- Inputs: `focus:ring-2 focus:ring-accent/50` ไม่ใช้ default browser outline
- Animations: fade-in ตอน mount / skeleton ระหว่าง loading / hover `transition duration-200`

## Localization (แอปคนไทย)

- UI text ทุกที่เป็นภาษาไทย (label, buttons, errors, modals, empty state)
- จำนวนเงิน: `฿` prefix + คั่นหลักพันด้วย `,`
- วันที่: `Intl.DateTimeFormat('th-TH')` เช่น `"17 พ.ค. 2569"`

## Responsive (Mobile-First)

- Target: iPhone SE (375px) ขึ้นไปถึง desktop
- เริ่ม layout ที่ 375px ก่อน แล้ว scale ด้วย Tailwind breakpoints (`sm:` `md:` `lg:`)
- Summary cards: 1 col mobile → 3 col desktop
- Dashboard charts: 1 col mobile → 2-3 col desktop
- Table: mobile เปลี่ยนเป็น card list / desktop เป็น table
- Modal: mobile fullscreen / desktop center dialog
- Touch target: ปุ่มขนาดอย่างน้อย 44×44px ตาม iOS HIG

## ห้าม

- Gradient แรง
- Emoji ไอคอนตกแต่ง
- Drop shadow หนา
- สีฉูดฉาด
- Font อื่นที่ไม่ใช่ Google Fonts
