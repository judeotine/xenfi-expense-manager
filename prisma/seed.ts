import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type UserRole = "ADMIN" | "STAFF";
type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@xenfi.com" },
    update: {},
    create: {
      email: "admin@xenfi.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN" as UserRole,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@xenfi.com" },
    update: {},
    create: {
      email: "staff@xenfi.com",
      password: staffPassword,
      name: "Staff User",
      role: "STAFF" as UserRole,
    },
  });

  await prisma.category.deleteMany();
  
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Office Supplies",
        description: "Stationery and office materials",
      },
    }),
    prisma.category.create({
      data: {
        name: "Travel",
        description: "Business travel expenses",
      },
    }),
    prisma.category.create({
      data: {
        name: "Meals",
        description: "Business meals and entertainment",
      },
    }),
    prisma.category.create({
      data: {
        name: "Utilities",
        description: "Electricity, water, internet bills",
      },
    }),
    prisma.category.create({
      data: {
        name: "Software",
        description: "Software licenses and subscriptions",
      },
    }),
  ]);

  const expenses = [];
  const paymentMethods: PaymentMethod[] = [
    "CASH",
    "CARD",
    "BANK_TRANSFER",
    "OTHER",
  ];
  const userIds = [admin.id, staff.id];
  const categoryIds = categories.map((cat: { id: string }) => cat.id);

  for (let i = 0; i < 10; i++) {
    const expense = await prisma.expense.create({
      data: {
        amount: (Math.random() * 1000 + 10).toFixed(2),
        description: `Expense ${i + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        paymentMethod:
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        attachmentUrl: Math.random() > 0.5 ? `https://example.com/receipt-${i + 1}.pdf` : null,
        userId: userIds[Math.floor(Math.random() * userIds.length)],
        categoryId: categoryIds[Math.floor(Math.random() * categoryIds.length)],
        createdBy: userIds[Math.floor(Math.random() * userIds.length)],
        updatedBy: userIds[Math.floor(Math.random() * userIds.length)],
      },
    });
    expenses.push(expense);
  }

  console.log("Seeded:", { admin, staff, categories, expenses });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

