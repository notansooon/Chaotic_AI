// routes/explore.ts
import { Router } from "express";
import prisma from "../libs/prisma";
import { Prisma, Complexity as PComplexity } from "@prisma/client";

const router = Router();



const parseDate = (s: string | null) => {
    if (!s) return null;
    
    const parts = String(s).match(/(\d+)\s*(d|h|m)/gi) || [];
    let ms = 0;
    for (const p of parts) {
        const [, num, unit] = p.match(/(\d+)\s*(d|h|m)/i)!;
        const n = Number(num);
        if (unit.toLowerCase() === 'd') ms += n * 24 * 60 * 60 * 1000;
        if (unit.toLowerCase() === 'h') ms += n * 60 * 60 * 1000;
        if (unit.toLowerCase() === 'm') ms += n * 60 * 1000;
    }
    return new Date(Date.now() + ms);
    
} 
const csv = (value?: string | string[]) =>
  Array.isArray(value)
    ? value
    : value
    ? value.split(",").map(s => s.trim()).filter(Boolean)
    : [];

const toDb = (c: "Easy" | "Medium" | "Hard"): PComplexity =>
  c.toUpperCase() as PComplexity;

const toUi = (c: PComplexity): "Easy" | "Medium" | "Hard" =>
  c === "EASY" ? "Easy" : c === "MEDIUM" ? "Medium" : "Hard";

const itemDTO = (r: any) => ({
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
    name: r.author.name ?? "",
    rating: r.author.rating ?? 0,
    reviews: r.author.reviews ?? 0,
  },
  stats: r.stats ?? undefined,
  saved: r.saved,
});

/** BASE: GET /explore  → all items  */
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.item.findMany({
      include: {
        author: { select: { id: true, name: true, rating: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows.map(itemDTO));
  } catch (e) {
    console.error("GET /explore error", e);
    res.status(500).json({ error: "Failed to load items" });
  }
});

/** FILTER: GET /explore/sort?q=&stacks=&complexities=&sort= */
router.get("/sort", async (req, res) => {
  try {
    const q = (req.query.q as string | undefined) ?? "";
    const stacks = csv(req.query.stacks as any);
    const complexities = csv(req.query.complexities as any) as ("Easy"|"Medium"|"Hard")[];
    const sort = (req.query.sort as "relevance"|"bountyDesc"|"newest" | undefined) ?? "relevance";

    const where: Prisma.ItemWhereInput = {};
    if (q) where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { brief: { contains: q, mode: "insensitive" } },
    ];
    if (stacks.length) where.stack = { hasSome: stacks };
    if (complexities.length) where.complexity = { in: complexities.map(toDb) };

    const orderBy =
      sort === "bountyDesc" ? { bountyUSD: "desc" } :
      sort === "newest"     ? { createdAt: "desc" } :
      undefined;

    const rows = await prisma.item.findMany({
      where: Object.keys(where).length ? where : undefined,
      //orderBy
      include: {
        author: { select: { id: true, name: true, rating: true, reviews: true } },
      },
      take: 100,
    });

    res.json(rows.map(itemDTO));
  } catch (e) {
    console.error("GET /explore/sort error", e);
    res.status(500).json({ error: "Failed to search items" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, rating: true, reviews: true } },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(itemDTO(row));
  } catch (e) {
    console.error("GET /explore/:id error", e);
    res.status(500).json({ error: "Failed to load item" });
  }
});

/** CREATE: POST /explore/create */
/** Not used Yet */
router.post("/create", async (req, res) => {
  try {
    // Replace this with real auth (JWT/cookie)
    const userId = (req as any).userId || req.header("x-user-id");
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const b = req.body as {
      title: string; brief: string; bountyUSD: number; timeLeft: string;
      complexity: "Easy"|"Medium"|"Hard"; stack: string[]; stats?: { files:number; loc:number; tests?:number };
    };

    if (!b?.title || !b?.brief || typeof b.bountyUSD !== "number" || !Array.isArray(b.stack)) {
      return res.status(400).json({ error: "Invalid body" });
    }

    const r = await prisma.item.create({
      data: {
        title: b.title,
        brief: b.brief,
        bountyUSD: b.bountyUSD,
        expiresAt: parseDate(b.timeLeft),
        complexity: toDb(b.complexity),
        stack: b.stack,
        stats: (b.stats ?? null) as Prisma.InputJsonValue | 0,
        authorId: String(userId),
      },
      include: {
        author: { select: { id: true, name: true, rating: true, reviews: true } },
      },
    });

    res.status(201).json(itemDTO(r));
  } catch (e) {
    console.error("POST /explore/create error", e);
    res.status(500).json({ error: "Failed to create item" });
  }
});

/** DELETE: DELETE /explore/item/:id  (only author can delete) */
/** Future implemtation */
router.delete("/item/:id", async (req, res) => {
  try {
    const userId = (req as any).userId || req.header("x-user-id");
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await prisma.item.deleteMany({
      where: { id: req.params.id, authorId: String(userId) },
    });

    if (result.count === 0) return res.status(403).json({ error: "Not allowed or not found" });
    res.status(204).end();
  } catch (e) {
    console.error("DELETE /explore/item/:id error", e);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
