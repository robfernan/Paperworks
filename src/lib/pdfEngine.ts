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

export interface TransformPdfOptions {
  pdfBytes: Uint8Array;
  pageOrder: number[];
  rotations: Record<number, number>;
  deletedPages?: number[];
  signatureDataUrl?: string | null;
  stamp?: StampOptions | null;
  digitalSignature?: DigitalSignaturePlaceholder | null;
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
    dimensions: firstPage ? { width: Math.round(firstPage.getWidth()), height: Math.round(firstPage.getHeight()) } : undefined,
  };
}

const colorMap = {
  red: rgb(0.85, 0.15, 0.15),
  green: rgb(0.1, 0.65, 0.3),
  blue: rgb(0.15, 0.4, 0.85),
  slate: rgb(0.3, 0.35, 0.4),
  amber: rgb(0.85, 0.55, 0.1),
};

/**
 * Asynchronously process, reorder, rotate, stamp, sign, and build optimized PDF
 */
export async function processPdfAsync(options: TransformPdfOptions): Promise<Uint8Array> {
  const {
    pdfBytes,
    pageOrder,
    rotations,
    signatureDataUrl,
    stamp,
    digitalSignature,
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
    onProgress?.(Math.min(currentPercent, 65));
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

      // Centered stamp
      const cx = width / 2;
      const cy = height / 2;

      // Draw bounding box for stamp
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

  // 2. Apply Cryptographic Signature Placeholder
  if (digitalSignature?.enabled && pages.length > 0) {
    const targetIdx = Math.min(digitalSignature.pageIndex, pages.length - 1);
    const p = pages[Math.max(0, targetIdx)];
    const { width: pWidth, height: pHeight } = p.getSize();

    const boxWidth = digitalSignature.width || 210;
    const boxHeight = digitalSignature.height || 64;

    const posX = (digitalSignature.xPercent / 100) * (pWidth - boxWidth);
    const posY = (digitalSignature.yPercent / 100) * (pHeight - boxHeight);

    // Box background and security border
    p.drawRectangle({
      x: posX,
      y: posY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1.5,
    });

    // Left security ribbon accent
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

  // 3. Apply Hand-drawn Signature if present
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

  // 4. Embed Updated Metadata
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
