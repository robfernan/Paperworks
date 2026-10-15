import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  inspectPdfMetadata,
  processPdfAsync,
  type StampOptions,
  type DigitalSignaturePlaceholder,
} from "../lib/pdfEngine";

describe("PDF Engine & Security Overlays", () => {
  it("should inspect metadata from a multi-page PDF document", async () => {
    const doc = await PDFDocument.create();
    doc.setTitle("Architecture Review");
    doc.setAuthor("Antigravity Engineer");
    doc.addPage([595, 842]);
    doc.addPage([595, 842]);
    const bytes = await doc.save();

    const meta = await inspectPdfMetadata(bytes);
    expect(meta.pageCount).toBe(2);
    expect(meta.title).toBe("Architecture Review");
    expect(meta.author).toBe("Antigravity Engineer");
    expect(meta.dimensions).toEqual({ width: 595, height: 842 });
  });

  it("should reorder, rotate, and stamp PDF pages asynchronously", async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([400, 400]);
    p1.drawText("Page 1 Source");
    const p2 = doc.addPage([400, 400]);
    p2.drawText("Page 2 Source");
    const bytes = await doc.save();

    const stamp: StampOptions = {
      type: "APPROVED",
      color: "green",
      opacity: 0.8,
      includeDate: true,
      signeeName: "Chief Architect",
      pageTarget: "first",
    };

    const digitalSignature: DigitalSignaturePlaceholder = {
      enabled: true,
      signerName: "Alex Mercer",
      reason: "Production Approval",
      location: "San Francisco",
      pageIndex: 0,
      xPercent: 10,
      yPercent: 10,
      width: 200,
      height: 60,
    };

    const outBytes = await processPdfAsync({
      pdfBytes: bytes,
      pageOrder: [1, 0], // Inverted page order
      rotations: { 0: 90 }, // Rotated first output page
      stamp,
      digitalSignature,
      metadata: {
        title: "Processed Certified Contract",
      },
    });

    expect(outBytes).toBeInstanceOf(Uint8Array);
    expect(outBytes.length).toBeGreaterThan(0);

    // Verify output document
    const resultDoc = await PDFDocument.load(outBytes);
    expect(resultDoc.getPageCount()).toBe(2);
    expect(resultDoc.getTitle()).toBe("Processed Certified Contract");
  });
});
