-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "ts" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "span" TEXT,
    "parentSpan" TEXT,
    "nodeKey" TEXT,
    "data" JSONB,
    "code" JSONB,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "span" TEXT,
    "parentId" TEXT,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "key" TEXT,
    "startedSeq" INTEGER NOT NULL,
    "endedSeq" INTEGER,
    "startedAt" BIGINT NOT NULL,
    "endedAt" BIGINT,
    "props" JSONB,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "createdSeq" INTEGER NOT NULL,
    "createdLine" INTEGER,
    "createdFile" TEXT,
    "kind" TEXT,
    "groupedUnderId" TEXT,
    "props" JSONB,

    CONSTRAINT "Edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL,
    "sourceMapId" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "SourceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cursor" (
    "runId" TEXT NOT NULL,
    "appliedSeq" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cursor_pkey" PRIMARY KEY ("runId")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graph" JSONB NOT NULL,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_runId_seq_idx" ON "Event"("runId", "seq");

-- CreateIndex
CREATE INDEX "Event_runId_span_idx" ON "Event"("runId", "span");

-- CreateIndex
CREATE INDEX "Node_runId_startedSeq_idx" ON "Node"("runId", "startedSeq");

-- CreateIndex
CREATE UNIQUE INDEX "Node_runId_num_key" ON "Node"("runId", "num");

-- CreateIndex
CREATE INDEX "Edge_runId_fromNodeId_ordinal_idx" ON "Edge"("runId", "fromNodeId", "ordinal");

-- CreateIndex
CREATE INDEX "Edge_runId_createdSeq_idx" ON "Edge"("runId", "createdSeq");

-- CreateIndex
CREATE INDEX "SourceFile_sourceMapId_file_digest_idx" ON "SourceFile"("sourceMapId", "file", "digest");

-- CreateIndex
CREATE INDEX "Snapshot_runId_ts_idx" ON "Snapshot"("runId", "ts");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cursor" ADD CONSTRAINT "Cursor_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
