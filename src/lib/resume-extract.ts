export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    // pdf-parse relies on pdfjs-dist, which expects browser globals that Node
    // does not provide (DOMMatrix & co). Polyfill them from @napi-rs/canvas,
    // which pdf-parse already ships.
    const { DOMMatrix, DOMPoint, DOMRect } = await import(
      "@napi-rs/canvas/geometry.js"
    );
    const g = globalThis as unknown as Record<string, unknown>;
    if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = DOMMatrix;
    if (typeof g.DOMPoint === "undefined") g.DOMPoint = DOMPoint;
    if (typeof g.DOMRect === "undefined") g.DOMRect = DOMRect;

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: await file.arrayBuffer() });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      buffer: await file.arrayBuffer(),
    });
    return result.value ?? "";
  }

  if (name.endsWith(".doc")) {
    const { default: WordExtractor } = await import("word-extractor");
    const extractor = new WordExtractor();
    const doc = await extractor.extract(Buffer.from(await file.arrayBuffer()));
    return doc.getBody() ?? "";
  }

  if (name.endsWith(".txt")) {
    return await file.text();
  }

  throw new Error("Unsupported file type. Use PDF, Word (.doc/.docx), or .txt.");
}
