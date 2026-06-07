const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const makerPassword = await bcrypt.hash('maker123', 10);
  const buyerPassword = await bcrypt.hash('myra1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@handmade.ua' },
    update: {},
    create: { email: 'admin@handmade.ua', name: 'Адміністратор', password: adminPassword, role: 'ADMIN' },
  });

  const karpo = await prisma.user.upsert({
    where: { email: 'karpo@handmade.ua' },
    update: {},
    create: { email: 'karpo@handmade.ua', name: 'Майстер Карпо', password: makerPassword, role: 'MAKER', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@handmade.ua' },
    update: { password: buyerPassword },
    create: { email: 'buyer@handmade.ua', name: 'Оксана Петрик', password: buyerPassword, role: 'BUYER', avatarUrl: 'https://i.pravatar.cc/150?img=25' },
  });

  console.log('✅ Users created:', admin.email, karpo.email, buyer.email);

  const prykrasy = await prisma.category.upsert({ where: { slug: 'prykrasy' }, update: {}, create: { name: 'Прикраси', slug: 'prykrasy' } });
  const odiah    = await prisma.category.upsert({ where: { slug: 'odiah' },    update: {}, create: { name: 'Одяг',     slug: 'odiah'    } });
  const posud    = await prisma.category.upsert({ where: { slug: 'posud' },    update: {}, create: { name: 'Посуд',    slug: 'posud'    } });
  const dekor    = await prisma.category.upsert({ where: { slug: 'dekor' },    update: {}, create: { name: 'Декор',    slug: 'dekor'    } });
  const ihrashky = await prisma.category.upsert({ where: { slug: 'ihrashky' }, update: {}, create: { name: 'Іграшки', slug: 'ihrashky' } });

  console.log('✅ Categories created');

  const upsert = async (name, data) => {
    const existing = await prisma.product.findFirst({ where: { name } });
    if (existing) return prisma.product.update({ where: { id: existing.id }, data });
    return prisma.product.create({ data: { name, ...data } });
  };

  // ── Прикраси (unique image per product)
  await upsert('Кольє ручної роботи з бурштином', {
    description: 'Витончене кольє з натурального бурштину у срібній оправі',
    price: 890, stock: 8, imageUrl: '/products/jewelry.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: prykrasy.id,
  });
  await upsert('Сережки-краплі з малахітом', {
    description: 'Елегантні сережки з натурального малахіту у позолоченій оправі',
    price: 450, stock: 3, imageUrl: '/products/earrings.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: prykrasy.id,
  });
  await upsert('Браслет плетений зі шкіри', {
    description: 'Чоловічий браслет ручного плетення з натуральної шкіри',
    price: 280, stock: 12, imageUrl: '/products/bracelet.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: prykrasy.id,
  });

  // ── Одяг
  await upsert('Вишита сорочка-вишиванка', {
    description: 'Традиційна українська вишиванка з ручною вишивкою хрестиком',
    price: 1850, stock: 5, imageUrl: '/products/clothing.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: odiah.id,
  });
  await upsert("В'язаний светр із мериносової вовни", {
    description: "Теплий светр ручної в'язки з 100% мериносової вовни",
    price: 1200, stock: 7, imageUrl: '/products/sweater.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: odiah.id,
  });
  await upsert('Льняна сукня вільного крою', {
    description: 'Легка літня сукня з натурального льону',
    price: 950, stock: 0, imageUrl: '/products/dress.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: odiah.id,
  });

  // ── Посуд
  await upsert('Керамічна чашка з орнаментом', {
    description: "Чашка ручної роботи з петриківським розписом, об'єм 350 мл",
    price: 320, stock: 15, imageUrl: '/products/pottery.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: posud.id,
  });
  await upsert('Набір тарілок гончарних', {
    description: 'Комплект із 4 гончарних тарілок із унікальним малюнком',
    price: 1100, stock: 4, imageUrl: '/products/plates.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: posud.id,
  });
  await upsert('Глечик для води декоративний', {
    description: 'Керамічний глечик із традиційним українським орнаментом',
    price: 680, stock: 9, imageUrl: '/products/jug.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: posud.id,
  });

  // ── Декор
  await upsert("Макраме панно 'Лісова стежина'", {
    description: 'Великоформатне макраме панно ручної роботи з натурального хлопку',
    price: 2200, stock: 2, imageUrl: '/products/decor.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: dekor.id,
  });
  await upsert('Свічка ароматична у кокосовому воску', {
    description: 'Eco-свічка ручної роботи з ефірними оліями лаванди',
    price: 185, stock: 20, imageUrl: '/products/candle.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: dekor.id,
  });
  await upsert('Вінок сухоцвітів на двері', {
    description: 'Декоративний вінок з природних сухоцвітів та трав',
    price: 450, stock: 6, imageUrl: '/products/wreath.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: dekor.id,
  });

  // ── Іграшки
  await upsert("М'яка іграшка 'Ведмедик Тедді'", {
    description: "Авторська м'яка іграшка ручної роботи з гіпоалергенного матеріалу",
    price: 650, stock: 8, imageUrl: '/products/bear.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: ihrashky.id,
  });
  await upsert("Дерев'яний конструктор 'Замок'", {
    description: "Розвиваючий конструктор із натурального дерева для дітей від 3 років",
    price: 890, stock: 5, imageUrl: '/products/constructor.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: ihrashky.id,
  });
  await upsert('Лялька-мотанка традиційна', {
    description: 'Традиційна українська лялька-мотанка, оберіг ручної роботи',
    price: 380, stock: 11, imageUrl: '/products/toy.png',
    status: 'APPROVED', makerId: karpo.id, categoryId: ihrashky.id,
  });

  console.log('✅ 15 products created with unique images');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
