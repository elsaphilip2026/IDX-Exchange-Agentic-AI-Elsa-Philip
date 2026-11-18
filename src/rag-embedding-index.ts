import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildRagChunks, type RagChunk } from "./rag-chunker.js";
import { getLocalEmbedding } from "./local-embeddings.js";

export interface IndexedRagChunk extends RagChunk {
  embedding: number[];
}

export async function buildRagEmbeddingIndex(): Promise<IndexedRagChunk[]> {
  const chunks = await buildRagChunks();
  const indexedChunks: IndexedRagChunk[] = [];

  console.log(`Generating embeddings for ${chunks.length} RAG chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const embedding = await getLocalEmbedding(chunk.text);

    indexedChunks.push({
      ...chunk,
      embedding,
    });

    if ((i + 1) % 25 === 0 || i === chunks.length - 1) {
      console.log(`Processed ${i + 1}/${chunks.length} chunks`);
    }
  }

  const outputPath = path.resolve("data/rag-index.json");

  await mkdir(path.dirname(outputPath), { recursive: true });

  await writeFile(
    outputPath,
    JSON.stringify(indexedChunks, null, 2),
    "utf8"
  );

  console.log(`RAG index saved to ${outputPath}`);

  return indexedChunks;
}

buildRagEmbeddingIndex().catch((error) => {
  console.error("Failed to build RAG index:", error);
  process.exitCode = 1;
});
