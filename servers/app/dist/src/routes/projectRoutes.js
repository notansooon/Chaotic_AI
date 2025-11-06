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
// routes/explore.ts
const express_1 = require("express");
const prisma_1 = __importDefault(require("../libs/prisma"));
const router = (0, express_1.Router)();
const parseDate = (s) => {
    if (!s)
        return null;
    const parts = String(s).match(/(\d+)\s*(d|h|m)/gi) || [];
    let ms = 0;
    for (const p of parts) {
        const [, num, unit] = p.match(/(\d+)\s*(d|h|m)/i);
        const n = Number(num);
        if (unit.toLowerCase() === 'd')
            ms += n * 24 * 60 * 60 * 1000;
        if (unit.toLowerCase() === 'h')
            ms += n * 60 * 60 * 1000;
        if (unit.toLowerCase() === 'm')
            ms += n * 60 * 1000;
    }
    return new Date(Date.now() + ms);
};
const csv = (value) => Array.isArray(value)
    ? value
    : value
        ? value.split(",").map(s => s.trim()).filter(Boolean)
        : [];
const toDb = (c) => c.toUpperCase();
const toUi = (c) => c === "EASY" ? "Easy" : c === "MEDIUM" ? "Medium" : "Hard";
const itemDTO = (r) => {
    var _a, _b, _c, _d;
    return ({
        id: r.id,
        title: r.title,
        brief: r.brief,
        bountyUSD: r.bountyUSD,
        timeLeft: r.timeLeft,
        complexity: toUi(r.complexity),
        stack: r.stack,
        authorId: r.authorId,
        author: r.author && {
            id: r.author.id,
            name: (_a = r.author.name) !== null && _a !== void 0 ? _a : "",
            rating: (_b = r.author.rating) !== null && _b !== void 0 ? _b : 0,
            reviews: (_c = r.author.reviews) !== null && _c !== void 0 ? _c : 0,
        },
        stats: (_d = r.stats) !== null && _d !== void 0 ? _d : undefined,
        saved: r.saved,
    });
};
/** BASE: GET /explore  → all items  */
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield prisma_1.default.item.findMany({
            include: {
                author: { select: { id: true, name: true, rating: true, reviews: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(rows.map(itemDTO));
    }
    catch (e) {
        console.error("GET /explore error", e);
        res.status(500).json({ error: "Failed to load items" });
    }
}));
/** FILTER: GET /explore/sort?q=&stacks=&complexities=&sort= */
router.get("/sort", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const q = (_a = req.query.q) !== null && _a !== void 0 ? _a : "";
        const stacks = csv(req.query.stacks);
        const complexities = csv(req.query.complexities);
        const sort = (_b = req.query.sort) !== null && _b !== void 0 ? _b : "relevance";
        const where = {};
        if (q)
            where.OR = [
                { title: { contains: q, mode: "insensitive" } },
                { brief: { contains: q, mode: "insensitive" } },
            ];
        if (stacks.length)
            where.stack = { hasSome: stacks };
        if (complexities.length)
            where.complexity = { in: complexities.map(toDb) };
        const orderBy = sort === "bountyDesc" ? { bountyUSD: "desc" } :
            sort === "newest" ? { createdAt: "desc" } :
                undefined;
        const rows = yield prisma_1.default.item.findMany({
            where: Object.keys(where).length ? where : undefined,
            //orderBy
            include: {
                author: { select: { id: true, name: true, rating: true, reviews: true } },
            },
            take: 100,
        });
        res.json(rows.map(itemDTO));
    }
    catch (e) {
        console.error("GET /explore/sort error", e);
        res.status(500).json({ error: "Failed to search items" });
    }
}));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const row = yield prisma_1.default.item.findUnique({
            where: { id: req.params.id },
            include: {
                author: { select: { id: true, name: true, rating: true, reviews: true } },
            },
        });
        if (!row)
            return res.status(404).json({ error: "Not found" });
        res.json(itemDTO(row));
    }
    catch (e) {
        console.error("GET /explore/:id error", e);
        res.status(500).json({ error: "Failed to load item" });
    }
}));
/** CREATE: POST /explore/create */
/** Not used Yet */
router.post("/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Replace this with real auth (JWT/cookie)
        const userId = req.userId || req.header("x-user-id");
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const b = req.body;
        if (!(b === null || b === void 0 ? void 0 : b.title) || !(b === null || b === void 0 ? void 0 : b.brief) || typeof b.bountyUSD !== "number" || !Array.isArray(b.stack)) {
            return res.status(400).json({ error: "Invalid body" });
        }
        const r = yield prisma_1.default.item.create({
            data: {
                title: b.title,
                brief: b.brief,
                bountyUSD: b.bountyUSD,
                expiresAt: parseDate(b.timeLeft),
                complexity: toDb(b.complexity),
                stack: b.stack,
                stats: ((_a = b.stats) !== null && _a !== void 0 ? _a : null),
                authorId: String(userId),
            },
            include: {
                author: { select: { id: true, name: true, rating: true, reviews: true } },
            },
        });
        res.status(201).json(itemDTO(r));
    }
    catch (e) {
        console.error("POST /explore/create error", e);
        res.status(500).json({ error: "Failed to create item" });
    }
}));
/** DELETE: DELETE /explore/item/:id  (only author can delete) */
/** Future implemtation */
router.delete("/item/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId || req.header("x-user-id");
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const result = yield prisma_1.default.item.deleteMany({
            where: { id: req.params.id, authorId: String(userId) },
        });
        if (result.count === 0)
            return res.status(403).json({ error: "Not allowed or not found" });
        res.status(204).end();
    }
    catch (e) {
        console.error("DELETE /explore/item/:id error", e);
        res.status(500).json({ error: "Failed to delete item" });
    }
}));
exports.default = router;
