import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

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
  let created = 0;
  let skipped = 0;

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, userId: null },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.category.create({ data: { ...cat, userId: null } });
    created++;
  }

  console.log(
    `Seed default categories — created: ${created}, skipped (already exist): ${skipped}`,
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
