import path from "node:path";
import dotenv from "dotenv";

// Allow `tsx prisma/seed.ts` directly; prisma CLI already loads .env via config.
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

import { PrismaClient, TransactionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const defaultCategories: Array<{
  name: string;
  icon: string;
  type: TransactionType;
}> = [
  // Expense
  { name: "อาหาร", icon: "🍚", type: TransactionType.EXPENSE },
  { name: "เดินทาง", icon: "🚗", type: TransactionType.EXPENSE },
  { name: "ที่อยู่", icon: "🏠", type: TransactionType.EXPENSE },
  { name: "สุขภาพ", icon: "💊", type: TransactionType.EXPENSE },
  { name: "บันเทิง", icon: "🎬", type: TransactionType.EXPENSE },
  { name: "การศึกษา", icon: "📚", type: TransactionType.EXPENSE },
  { name: "อื่นๆ", icon: "📦", type: TransactionType.EXPENSE },
  // Income
  { name: "เงินเดือน", icon: "💰", type: TransactionType.INCOME },
  { name: "โบนัส", icon: "🎁", type: TransactionType.INCOME },
  { name: "รายได้อื่นๆ", icon: "💵", type: TransactionType.INCOME },
];

async function main() {
  // Prisma 7 rejects null in compound-unique upsert keys, so do find-then-write.
  // The @@unique on Category still protects user-scoped duplicates (userId not null).
  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, userId: null },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon },
      });
    } else {
      await prisma.category.create({
        data: { ...cat, userId: null },
      });
    }
  }

  console.log(
    `Seeded ${defaultCategories.length} default categories (idempotent).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
