// prisma/seed.ts
import { PrismaClient, Complexity } from '@prisma/client';
import prisma from '../src/libs/prisma';


const plus = (days:number) => new Date(Date.now() + days*24*60*60*1000);

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob', emailVerified: true, createdAt: new Date(), updatedAt: new Date()  },
  });

  await prisma.item.createMany({
    data: [
      {
        id: 'item1',
        title: 'Security review for Express auth middleware',
        brief: 'Check session fixation, CSRF, JWT rotation.',
        bountyUSD: 250,
        expiresAt: plus(3),                      
        complexity: Complexity.MEDIUM,
        stack: ['Node.js','Express','JWT'],
        stats: { files: 7, loc: 540, tests: 10 } as any,
        authorId: alice.id,
      },
      {
        id: 'item2',
        title: 'Performance audit for React table',
        brief: 'Virtualize rows, memoization, suspense.',
        bountyUSD: 400,
        expiresAt: plus(5),
        complexity: Complexity.HARD,
        stack: ['React','TypeScript'],
        stats: { files: 9, loc: 780, tests: 6 } as any,
        authorId: alice.id,
      },
      {
        id: 'item3',
        title: 'Python ETL review (pandas)',
        brief: 'Memory usage, chunked IO, joins.',
        bountyUSD: 280,
        expiresAt: plus(4),
        complexity: Complexity.MEDIUM,
        stack: ['Python','pandas'],
        stats: { files: 6, loc: 520, tests: 8 } as any,
        authorId: bob.id,
      },
    ],
  });

  console.log('Seeded');
}

main().finally(() => prisma.$disconnect());
