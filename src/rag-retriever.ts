import { readFile } from "node:fs/promises";
import path from "node:path";
import { getLocalEmbedding } from "./local-embeddings.js";
import { cosineSimilarity } from "./vector-similarity.js";
import type { IndexedRagChunk } from "./rag-embedding-index.js";

export interface RagSearchResult {
  id: string;
  source: string;
  page: number | null;
  text: string;
  score: number;
}

let cachedIndex: IndexedRagChunk[] | null = null;

async function loadRagIndex(): Promise<IndexedRagChunk[]> {
  if (cachedIndex) return cachedIndex;

  const indexPath = path.resolve("data/rag-index.json");
  const contents = await readFile(indexPath, "utf8");

  cachedIndex = JSON.parse(contents) as IndexedRagChunk[];
  return cachedIndex;
}

export async function retrieveRagChunks(
  question: string,
  topK = 4
): Promise<RagSearchResult[]> {
  if (!question.trim()) {
    return [];
  }

  const index = await loadRagIndex();
  const questionEmbedding = await getLocalEmbedding(question);

  return index
    .map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      page: chunk.page,
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, topK));
}

async function main() {
  const question = process.argv.slice(2).join(" ");

  if (!question) {
    console.log('Usage: npx tsx src/rag-retriever.ts "Your question"');
    return;
  }

  const results = await retrieveRagChunks(question);

  console.log(`Question: ${question}`);

  for (const [index, result] of results.entries()) {
    console.log(`\nResult ${index + 1}`);
    console.log(`Source: ${result.source}`);
    console.log(`Page: ${result.page ?? "N/A"}`);
    console.log(`Similarity: ${result.score.toFixed(4)}`);
    console.log(`Text: ${result.text.slice(0, 400)}...`);
  }
}

if (process.argv[1]?.endsWith("rag-retriever.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
