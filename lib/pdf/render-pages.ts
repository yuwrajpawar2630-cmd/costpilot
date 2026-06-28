import { MAX_ANALYSIS_PAGES } from "@/lib/constants";

export async function renderPdfPagesToBase64(
  pdfBuffer: Buffer,
  maxPages = MAX_ANALYSIS_PAGES
): Promise<string[]> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const uint8 = new Uint8Array(pdfBuffer);
    const doc = await pdfjs.getDocument({ data: uint8, useSystemFonts: true }).promise;
    const pageCount = Math.min(doc.numPages, maxPages);
    const images: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const { createCanvas } = await import("@napi-rs/canvas");
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      }).promise;

      const pngBuffer = canvas.toBuffer("image/png");
      images.push(pngBuffer.toString("base64"));
    }

    return images;
  } catch {
    return [];
  }
}

export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    }).promise;
    return doc.numPages;
  } catch {
    return 1;
  }
}
