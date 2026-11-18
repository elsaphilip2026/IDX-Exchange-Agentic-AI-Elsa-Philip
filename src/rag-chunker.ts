import { loadRagDocuments } from "./rag-document-loader.js";

export interface RagChunk {
  id: string;
  source: string;
  page: number | null;
  text: string;
}

export function chunkText(
  text: string,
  chunkSize = 600,
  overlap = 100
): string[] {
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error("Invalid chunk size or overlap");
  }

  const chunks: string[] = [];
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (!cleaned) return chunks;

  const step = chunkSize - overlap;

  for (let start = 0; start < cleaned.length; start += step) {
    const chunk = cleaned.slice(start, start + chunkSize);

    if (chunk.trim()) {
      chunks.push(chunk);
    }

    if (start + chunkSize >= cleaned.length) break;
  }

  return chunks;
}

export async function buildRagChunks(): Promise<RagChunk[]> {
  const documents = await loadRagDocuments();
  const chunks: RagChunk[] = [];

  for (const document of documents) {
    const textChunks = chunkText(document.text);

    textChunks.forEach((text, index) => {
      chunks.push({
        id: `${document.source}-page-${document.page ?? "NA"}-chunk-${index + 1}`,
        source: document.source,
        page: document.page,
        text,
      });
    });
  }

  return chunks;
}

async function main() {
  const chunks = await buildRagChunks();

  console.log(`Total RAG chunks: ${chunks.length}`);

  for (const chunk of chunks.slice(0, 5)) {
    console.log(
      `${chunk.id} | ${chunk.text.length} characters`
    );
  }
}

if (process.argv[1]?.endsWith("rag-chunker.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
