import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

export interface RagDocument {
  source: string;
  page: number | null;
  text: string;
}

const SOURCE_DIR = path.resolve("data/rag-sources");

export async function loadRagDocuments(): Promise<RagDocument[]> {
  const documents: RagDocument[] = [];

  const pdfFiles = [
    "Real_Estate_Data_Analys_Primer.pdf",
    "Trestle Property MetaData.pdf",
  ];

  for (const filename of pdfFiles) {
    const buffer = await readFile(path.join(SOURCE_DIR, filename));
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
      const info = await parser.getInfo();

      for (let page = 1; page <= info.total; page++) {
        const result = await parser.getText({
          partial: [page],
        });

        const text = result.text.replace(/\s+/g, " ").trim();

        if (text) {
          documents.push({
            source: filename,
            page,
            text,
          });
        }
      }
    } finally {
      await parser.destroy();
    }
  }

  const markdownFile = "week5-market-statistics.md";
  const markdown = await readFile(
    path.join(SOURCE_DIR, markdownFile),
    "utf8"
  );

  documents.push({
    source: markdownFile,
    page: null,
    text: markdown,
  });

  const schemaFile = "california-sold-schema.txt";
  const schema = await readFile(
    path.join(SOURCE_DIR, schemaFile),
    "utf8"
  );

  documents.push({
    source: schemaFile,
    page: null,
    text: `Database: california_sold
Table: california_sold
The following are the actual MySQL columns and data types for the california_sold table.
${schema}`,
  });

  return documents;
}

async function main() {
  const documents = await loadRagDocuments();

  console.log(`Loaded ${documents.length} document sections`);

  for (const doc of documents) {
    console.log(
      `${doc.source} | Page ${doc.page ?? "N/A"} | ${doc.text.length} characters`
    );
  }
}

if (process.argv[1]?.endsWith("rag-document-loader.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
