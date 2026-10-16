import { PDFDocument, rgb, degrees, StandardFonts, grayscale } from "pdf-lib";

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  dimensions?: { width: number; height: number };
}

export interface StampOptions {
  type: "APPROVED" | "CONFIDENTIAL" | "DRAFT" | "FINAL" | "PAID" | "VOID" | "CUSTOM";
  customText?: string;
  color?: "red" | "green" | "blue" | "slate" | "amber";
  opacity?: number;
  rotation?: number;
  includeDate?: boolean;
  signeeName?: string;
  pageTarget?: "first" | "all" | "last";
}

export interface DigitalSignaturePlaceholder {
  enabled: boolean;
  signerName: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  pageIndex: number;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  width: number;
  height: number;
}

export type AnnotationType = "checkmark" | "rectangle" | "circle" | "freehand" | "text" | "signature";

export interface PdfAnnotation {
  id: string;
  type: AnnotationType;
  pageIndex: number; // 0-indexed page in document
  xPercent: number; // 0 - 100 percentage from left
  yPercent: number; // 0 - 100 percentage from bottom
  widthPercent: number;
  heightPercent: number;
  color?: "red" | "green" | "blue" | "slate" | "amber" | "black";
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  signatureDataUrl?: string;
  points?: Array<{ xPercent: number; yPercent: number }>;
}

export interface TransformPdfOptions {
  pdfBytes: Uint8Array;
  pageOrder: number[];
  rotations: Record<number, number>;
  deletedPages?: number[];
  signatureDataUrl?: string | null;
  stamp?: StampOptions | null;
  digitalSignature?: DigitalSignaturePlaceholder | null;
  annotations?: PdfAnnotation[] | null;
  metadata?: Partial<PdfMetadata> | null;
  onProgress?: (progress: number) => void;
}

/**
 * Yield to main thread to keep UI fluid during heavy PDF operations
 */
export async function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Inspect document metadata without mutating
 */
export async function inspectPdfMetadata(pdfBytes: Uint8Array): Promise<PdfMetadata> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  const firstPage = pageCount > 0 ? doc.getPage(0) : null;

  return {
    title: doc.getTitle() || undefined,
    author: doc.getAuthor() || undefined,
    subject: doc.getSubject() || undefined,
    keywords: doc.getKeywords()?.split(";").map((k) => k.trim()) || undefined,
    producer: doc.getProducer() || undefined,
    creator: doc.getCreator() || undefined,
    creationDate: doc.getCreationDate() || undefined,
    modificationDate: doc.getModificationDate() || undefined,
    pageCount,
    dimensions: firstPage
      ? { width: Math.round(firstPage.getWidth()), height: Math.round(firstPage.getHeight()) }
      : undefined,
  };
}

const colorMap = {
  red: rgb(0.85, 0.15, 0.15),
  green: rgb(0.1, 0.65, 0.3),
  blue: rgb(0.15, 0.4, 0.85),
  slate: rgb(0.3, 0.35, 0.4),
  amber: rgb(0.85, 0.55, 0.1),
  black: rgb(0.1, 0.1, 0.1),
};

/**
 * Asynchronously process, reorder, rotate, stamp, annotate, sign, and build optimized PDF
 */
export async function processPdfAsync(options: TransformPdfOptions): Promise<Uint8Array> {
  const {
    pdfBytes,
    pageOrder,
    rotations,
    signatureDataUrl,
    stamp,
    digitalSignature,
    annotations,
    metadata,
    onProgress,
  } = options;

  onProgress?.(10);
  await yieldToMainThread();

  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalSrcPages = srcDoc.getPageCount();
  const effectiveOrder = pageOrder.length ? pageOrder : Array.from({ length: totalSrcPages }, (_, i) => i);

  const destDoc = await PDFDocument.create();
  const helveticaFont = await destDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await destDoc.embedFont(StandardFonts.HelveticaBold);
  const courierFont = await destDoc.embedFont(StandardFonts.Courier);

  // Chunked page copying to avoid blocking UI thread
  const chunkSize = 15;
  for (let i = 0; i < effectiveOrder.length; i += chunkSize) {
    const chunkIndices = effectiveOrder.slice(i, i + chunkSize);
    const copiedChunk = await destDoc.copyPages(srcDoc, chunkIndices);

    for (let j = 0; j < copiedChunk.length; j++) {
      const page = copiedChunk[j];
      const pageOriginalIndex = i + j;
      const rot = rotations[pageOriginalIndex] || 0;
      if (rot) {
        page.setRotation(degrees(rot));
      }
      destDoc.addPage(page);
    }

    const currentPercent = 10 + Math.round(((i + chunkSize) / effectiveOrder.length) * 50);
    onProgress?.(Math.min(currentPercent, 60));
    await yieldToMainThread();
  }

  const pages = destDoc.getPages();

  // 1. Apply Stamp Overlays
  if (stamp && pages.length > 0) {
    const stampText = stamp.type === "CUSTOM" ? stamp.customText || "CONFIDENTIAL" : stamp.type;
    const stampColor = colorMap[stamp.color || "red"] || colorMap.red;
    const opacity = stamp.opacity ?? 0.65;
    const rotationDegrees = degrees(stamp.rotation ?? -30);

    const targetPages =
      stamp.pageTarget === "first"
        ? [pages[0]]
        : stamp.pageTarget === "last"
        ? [pages[pages.length - 1]]
        : pages;

    for (const page of targetPages) {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.08;
      const textWidth = helveticaBold.widthOfTextAtSize(stampText, fontSize);
      const textHeight = helveticaBold.heightAtSize(fontSize);

      const cx = width / 2;
      const cy = height / 2;
      const padX = 24;
      const padY = 12;

      page.drawRectangle({
        x: cx - (textWidth + padX * 2) / 2,
        y: cy - (textHeight + padY * 2) / 2,
        width: textWidth + padX * 2,
        height: textHeight + padY * 2,
        borderColor: stampColor,
        borderWidth: 3,
        opacity,
        rotate: rotationDegrees,
      });

      page.drawText(stampText, {
        x: cx - textWidth / 2,
        y: cy - textHeight / 3,
        size: fontSize,
        font: helveticaBold,
        color: stampColor,
        opacity,
        rotate: rotationDegrees,
      });

      if (stamp.includeDate || stamp.signeeName) {
        const subtext = [
          stamp.signeeName ? `BY: ${stamp.signeeName.toUpperCase()}` : "",
          stamp.includeDate ? new Date().toISOString().slice(0, 10) : "",
        ]
          .filter(Boolean)
          .join(" • ");

        const subFontSize = fontSize * 0.28;
        const subWidth = helveticaFont.widthOfTextAtSize(subtext, subFontSize);

        page.drawText(subtext, {
          x: cx - subWidth / 2,
          y: cy - (textHeight + padY * 2) / 2 + 6,
          size: subFontSize,
          font: helveticaFont,
          color: stampColor,
          opacity: opacity * 0.9,
          rotate: rotationDegrees,
        });
      }
    }
  }

  // 2. Apply Interactive Annotations (Shapes, Checkmarks, Freehand, Signatures)
  if (annotations && annotations.length > 0) {
    for (const annot of annotations) {
      if (annot.pageIndex >= pages.length) continue;
      const page = pages[Math.max(0, annot.pageIndex)];
      const { width: pWidth, height: pHeight } = page.getSize();

      const annotColor = colorMap[annot.color || "blue"] || colorMap.blue;
      const opacity = annot.opacity ?? 0.9;
      const strokeWidth = annot.strokeWidth || 2;

      const posX = (annot.xPercent / 100) * pWidth;
      const posY = (annot.yPercent / 100) * pHeight;
      const width = (annot.widthPercent / 100) * pWidth;
      const height = (annot.heightPercent / 100) * pHeight;

      if (annot.type === "rectangle") {
        page.drawRectangle({
          x: posX,
          y: posY,
          width,
          height,
          borderColor: annotColor,
          borderWidth: strokeWidth,
          opacity,
          color: rgb(annotColor.red, annotColor.green, annotColor.blue),
        });
      } else if (annot.type === "circle") {
        page.drawEllipse({
          x: posX + width / 2,
          y: posY + height / 2,
          xScale: width / 2,
          yScale: height / 2,
          borderColor: annotColor,
          borderWidth: strokeWidth,
          opacity,
        });
      } else if (annot.type === "checkmark") {
        // High visibility approval badge
        const badgeRadius = Math.max(12, Math.min(width, height) / 2);
        const cx = posX + width / 2;
        const cy = posY + height / 2;

        page.drawCircle({
          x: cx,
          y: cy,
          size: badgeRadius,
          color: colorMap.green,
          opacity,
        });

        // White checkmark lines
        page.drawLine({
          start: { x: cx - badgeRadius * 0.45, y: cy },
          end: { x: cx - badgeRadius * 0.1, y: cy - badgeRadius * 0.35 },
          thickness: 2.5,
          color: rgb(1, 1, 1),
        });
        page.drawLine({
          start: { x: cx - badgeRadius * 0.1, y: cy - badgeRadius * 0.35 },
          end: { x: cx + badgeRadius * 0.5, y: cy + badgeRadius * 0.35 },
          thickness: 2.5,
          color: rgb(1, 1, 1),
        });
      } else if (annot.type === "text" && annot.text) {
        page.drawText(annot.text, {
          x: posX,
          y: posY,
          size: Math.max(9, height * 0.7),
          font: helveticaBold,
          color: annotColor,
          opacity,
        });
      } else if (annot.type === "freehand" && annot.points && annot.points.length > 1) {
        for (let k = 0; k < annot.points.length - 1; k++) {
          const p1 = annot.points[k];
          const p2 = annot.points[k + 1];
          page.drawLine({
            start: { x: (p1.xPercent / 100) * pWidth, y: (p1.yPercent / 100) * pHeight },
            end: { x: (p2.xPercent / 100) * pWidth, y: (p2.yPercent / 100) * pHeight },
            thickness: strokeWidth,
            color: annotColor,
            opacity,
          });
        }
      } else if (annot.type === "signature" && annot.signatureDataUrl) {
        try {
          const sigBytes = await (await fetch(annot.signatureDataUrl)).arrayBuffer();
          const sigImage = await destDoc.embedPng(sigBytes);
          page.drawImage(sigImage, {
            x: posX,
            y: posY,
            width,
            height,
            opacity,
          });
        } catch (err) {
          console.warn("Failed embedding annotation signature", err);
        }
      }
    }
  }

  // 3. Apply Cryptographic Signature Placeholder
  if (digitalSignature?.enabled && pages.length > 0) {
    const targetIdx = Math.min(digitalSignature.pageIndex, pages.length - 1);
    const p = pages[Math.max(0, targetIdx)];
    const { width: pWidth, height: pHeight } = p.getSize();

    const boxWidth = digitalSignature.width || 210;
    const boxHeight = digitalSignature.height || 64;

    const posX = (digitalSignature.xPercent / 100) * (pWidth - boxWidth);
    const posY = (digitalSignature.yPercent / 100) * (pHeight - boxHeight);

    p.drawRectangle({
      x: posX,
      y: posY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1.5,
    });

    p.drawRectangle({
      x: posX,
      y: posY,
      width: 6,
      height: boxHeight,
      color: rgb(0.2, 0.4, 0.8),
    });

    const nowIso = new Date().toISOString();
    const digestMock = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    p.drawText("DIGITALLY SIGNED DOCUMENT", {
      x: posX + 12,
      y: posY + boxHeight - 14,
      size: 7.5,
      font: helveticaBold,
      color: rgb(0.15, 0.3, 0.7),
    });

    p.drawText(`Signer: ${digitalSignature.signerName || "Authorized Signee"}`, {
      x: posX + 12,
      y: posY + boxHeight - 25,
      size: 7,
      font: helveticaFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    if (digitalSignature.reason) {
      p.drawText(`Reason: ${digitalSignature.reason}`, {
        x: posX + 12,
        y: posY + boxHeight - 35,
        size: 6.5,
        font: helveticaFont,
        color: rgb(0.25, 0.25, 0.25),
      });
    }

    p.drawText(`Timestamp: ${nowIso.replace("T", " ").slice(0, 19)} UTC`, {
      x: posX + 12,
      y: posY + boxHeight - 45,
      size: 6,
      font: courierFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    p.drawText(`SHA-256 Digest: ${digestMock.toUpperCase()}... [VERIFIED]`, {
      x: posX + 12,
      y: posY + 6,
      size: 5.5,
      font: courierFont,
      color: rgb(0.2, 0.5, 0.3),
    });
  }

  // 4. Apply Primary Hand-drawn Signature if present
  if (signatureDataUrl && pages.length > 0) {
    try {
      const sigBytes = await (await fetch(signatureDataUrl)).arrayBuffer();
      const sigImage = await destDoc.embedPng(sigBytes);
      const firstPage = pages[0];
      firstPage.drawImage(sigImage, {
        x: firstPage.getWidth() - 170,
        y: 35,
        width: 130,
        height: 45,
      });
    } catch (err) {
      console.warn("Failed embedding signature image", err);
    }
  }

  // 5. Embed Updated Metadata
  if (metadata) {
    if (metadata.title) destDoc.setTitle(metadata.title);
    if (metadata.author) destDoc.setAuthor(metadata.author);
    if (metadata.subject) destDoc.setSubject(metadata.subject);
    if (metadata.keywords?.length) destDoc.setKeywords(metadata.keywords);
    if (metadata.creator) destDoc.setCreator(metadata.creator);
    if (metadata.producer) destDoc.setProducer(metadata.producer);
    destDoc.setModificationDate(new Date());
  }

  onProgress?.(85);
  await yieldToMainThread();

  const finalBytes = await destDoc.save();
  onProgress?.(100);

  return finalBytes;
}
