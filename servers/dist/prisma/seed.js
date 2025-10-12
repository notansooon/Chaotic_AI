"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../src/libs/prisma"));
const plus = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const alice = yield prisma_1.default.user.upsert({
            where: { email: 'alice@example.com' },
            update: {},
            create: { email: 'alice@example.com', name: 'Alice', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
        });
        const bob = yield prisma_1.default.user.upsert({
            where: { email: 'bob@example.com' },
            update: {},
            create: { email: 'bob@example.com', name: 'Bob', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
        });
        yield prisma_1.default.item.createMany({
            data: [
                {
                    id: 'item1',
                    title: 'Security review for Express auth middleware',
                    brief: 'Check session fixation, CSRF, JWT rotation.',
                    bountyUSD: 250,
                    expiresAt: plus(3),
                    complexity: client_1.Complexity.MEDIUM,
                    stack: ['Node.js', 'Express', 'JWT'],
                    stats: { files: 7, loc: 540, tests: 10 },
                    authorId: alice.id,
                },
                {
                    id: 'item2',
                    title: 'Performance audit for React table',
                    brief: 'Virtualize rows, memoization, suspense.',
                    bountyUSD: 400,
                    expiresAt: plus(5),
                    complexity: client_1.Complexity.HARD,
                    stack: ['React', 'TypeScript'],
                    stats: { files: 9, loc: 780, tests: 6 },
                    authorId: alice.id,
                },
                {
                    id: 'item3',
                    title: 'Python ETL review (pandas)',
                    brief: 'Memory usage, chunked IO, joins.',
                    bountyUSD: 280,
                    expiresAt: plus(4),
                    complexity: client_1.Complexity.MEDIUM,
                    stack: ['Python', 'pandas'],
                    stats: { files: 6, loc: 520, tests: 8 },
                    authorId: bob.id,
                },
            ],
        });
        console.log('Seeded');
    });
}
main().finally(() => prisma_1.default.$disconnect());
