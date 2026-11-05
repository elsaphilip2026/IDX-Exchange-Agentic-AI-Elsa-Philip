import { pipeline } from "@huggingface/transformers";

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { device: "cpu" }
    ).catch((error) => {
      extractorPromise = null;
      throw error;
    });
  }

  return extractorPromise;
}

export async function getLocalEmbedding(
  text: string
): Promise<number[]> {
  const extractor = await getExtractor();

  const result = await extractor(
    text.replace(/\s+/g, " ").trim().slice(0, 4000),
    {
      pooling: "mean",
      normalize: true,
    }
  );

  return Array.from(result.data);
}
