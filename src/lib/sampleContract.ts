import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateSampleContractPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedStandardFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedStandardFont(StandardFonts.HelveticaOblique);

  // --- PAGE 1 ---
  const page1 = doc.addPage([612, 792]); // Letter size
  const { width, height } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 40,
    y: height - 60,
    width: width - 80,
    height: 3,
    color: rgb(0.12, 0.22, 0.42),
  });

  page1.drawText("RESIDENTIAL LEASE & PURCHASE AGREEMENT", {
    x: 40,
    y: height - 50,
    size: 15,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.3),
  });

  page1.drawText("STANDARD AGREEMENT FORM • NON-FILLABLE FLAT DOCUMENT", {
    x: 40,
    y: height - 74,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Section 1: Parties
  let y = height - 105;
  page1.drawText("1. PARTIES AND PREMISES", { x: 40, y, size: 10, font: fontBold, color: rgb(0.1, 0.18, 0.35) });
  y -= 4;
  page1.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.7, 0.75, 0.8) });

  y -= 22;
  page1.drawText("Landlord / Seller:", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 125, y: y - 1 }, end: { x: 320, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("Phone / Email:", { x: 335, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 405, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  y -= 22;
  page1.drawText("Tenant / Buyer:", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 125, y: y - 1 }, end: { x: 320, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("Phone / Email:", { x: 335, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 405, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  y -= 22;
  page1.drawText("Property Address:", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 125, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  y -= 22;
  page1.drawText("City, State, Zip:", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 125, y: y - 1 }, end: { x: 320, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("Lease Term (Months):", { x: 335, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 440, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  // Section 2: Financial Terms
  y -= 35;
  page1.drawText("2. FINANCIAL TERMS & RENT SCHEDULE", { x: 40, y, size: 10, font: fontBold, color: rgb(0.1, 0.18, 0.35) });
  y -= 4;
  page1.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.7, 0.75, 0.8) });

  y -= 22;
  page1.drawText("Monthly Rent ($):", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 125, y: y - 1 }, end: { x: 260, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("Security Deposit ($):", { x: 280, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 385, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  y -= 22;
  page1.drawText("Commencement Date:", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 145, y: y - 1 }, end: { x: 260, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("Expiration Date:", { x: 280, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 385, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  // Section 3: Contingencies & Checkboxes
  y -= 35;
  page1.drawText("3. MANDATORY DISCLOSURES & ELECTIONS (Check All Applicable)", { x: 40, y, size: 10, font: fontBold, color: rgb(0.1, 0.18, 0.35) });
  y -= 4;
  page1.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.7, 0.75, 0.8) });

  const checkboxes = [
    "Lead-Based Paint Disclosure (Housing constructed prior to 1978)",
    "Smoke Detector & Carbon Monoxide Alarm Certification verified",
    "Homeowner Association (HOA) Bylaws & Regulations acknowledged",
    "Option to Purchase Rider attached with designated option consideration",
    "Property Condition Assessment complete; Tenant accepts premises in AS-IS condition",
    "Pet Addendum authorized by Landlord with additional refundable deposit",
  ];

  checkboxes.forEach((cb) => {
    y -= 22;
    page1.drawRectangle({
      x: 42,
      y: y - 2,
      width: 13,
      height: 13,
      borderWidth: 1,
      borderColor: rgb(0.2, 0.2, 0.2),
      color: rgb(1, 1, 1),
    });
    page1.drawText(cb, { x: 65, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
  });

  // Section 4: Purchase Option Terms
  y -= 35;
  page1.drawText("4. EXCLUSIVE OPTION TO PURCHASE SPECIFICATIONS", { x: 40, y, size: 10, font: fontBold, color: rgb(0.1, 0.18, 0.35) });
  y -= 4;
  page1.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.7, 0.75, 0.8) });

  y -= 22;
  page1.drawText("Agreed Purchase Price ($):", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 175, y: y - 1 }, end: { x: 320, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  page1.drawText("Option Fee ($):", { x: 335, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 415, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  y -= 22;
  page1.drawText("Title / Settlement Agent:", { x: 40, y, size: 9, font: fontBold });
  page1.drawLine({ start: { x: 160, y: y - 1 }, end: { x: width - 40, y: y - 1 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

  // Page 1 Footer Initials
  page1.drawText("Tenant / Buyer Initials: [         ]", { x: 40, y: 35, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText("Landlord / Seller Initials: [         ]", { x: 360, y: 35, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText("Page 1 of 2", { x: width / 2 - 20, y: 35, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });


  // --- PAGE 2 ---
  const page2 = doc.addPage([612, 792]);

  page2.drawText("RESIDENTIAL LEASE & PURCHASE AGREEMENT (CONTINUED)", {
    x: 40,
    y: height - 50,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.3),
  });
  page2.drawLine({ start: { x: 40, y: height - 60 }, end: { x: width - 40, y: height - 60 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  let y2 = height - 90;
  page2.drawText("5. TERMS, COVENANTS & ENTIRE AGREEMENT", { x: 40, y: y2, size: 10, font: fontBold, color: rgb(0.1, 0.18, 0.35) });
  y2 -= 4;
  page2.drawLine({ start: { x: 40, y: y2 }, end: { x: width - 40, y: y2 }, thickness: 0.5, color: rgb(0.7, 0.75, 0.8) });

  const legalClauses = [
    "A. Governing Law: This agreement shall be construed and governed in accordance with state and local jurisdiction.",
    "B. Default & Remedies: Failure to remit monthly consideration within five (5) calendar days incurs standard liquidated damages.",
    "C. Right of Inspection: Landlord retains the right to inspect premises upon giving twenty-four (24) hours advance written notice.",
    "D. Assignment & Subletting: Tenant shall not assign, sublet, or transfer rights under this agreement without prior written approval.",
    "E. Signatures & Electronic Transmission: Facsimile or digital signature stamps shall be treated in all respects as original handwritten signatures.",
  ];

  legalClauses.forEach((clause) => {
    y2 -= 20;
    page2.drawText(clause, { x: 40, y: y2, size: 8.5, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
  });

  // Section 6: Execution & Signatures
  y2 -= 45;
  page2.drawText("6. EXECUTION AND SIGNATURE ATTESTATION", { x: 40, y: y2, size: 10, font: fontBold, color: rgb(0.1, 0.18, 0.35) });
  y2 -= 4;
  page2.drawLine({ start: { x: 40, y: y2 }, end: { x: width - 40, y: y2 }, thickness: 0.5, color: rgb(0.7, 0.75, 0.8) });

  y2 -= 18;
  page2.drawText("IN WITNESS WHEREOF, the undersigned parties execute and deliver this instrument as of the date written below:", {
    x: 40,
    y: y2,
    size: 8.5,
    font: fontOblique,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Signature Block 1: Tenant
  y2 -= 50;
  page2.drawText("Tenant / Buyer Signature:", { x: 40, y: y2 + 25, size: 9, font: fontBold });
  page2.drawText("X", { x: 40, y: y2, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page2.drawLine({ start: { x: 55, y: y2 }, end: { x: 330, y: y2 }, thickness: 0.75, color: rgb(0.2, 0.2, 0.2) });

  page2.drawText("Date:", { x: 360, y: y2 + 25, size: 9, font: fontBold });
  page2.drawLine({ start: { x: 360, y: y2 }, end: { x: width - 40, y: y2 }, thickness: 0.75, color: rgb(0.2, 0.2, 0.2) });

  y2 -= 16;
  page2.drawText("Printed Name:", { x: 40, y: y2, size: 8.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page2.drawLine({ start: { x: 105, y: y2 - 1 }, end: { x: 330, y: y2 - 1 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

  // Signature Block 2: Landlord
  y2 -= 60;
  page2.drawText("Landlord / Seller Signature:", { x: 40, y: y2 + 25, size: 9, font: fontBold });
  page2.drawText("X", { x: 40, y: y2, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page2.drawLine({ start: { x: 55, y: y2 }, end: { x: 330, y: y2 }, thickness: 0.75, color: rgb(0.2, 0.2, 0.2) });

  page2.drawText("Date:", { x: 360, y: y2 + 25, size: 9, font: fontBold });
  page2.drawLine({ start: { x: 360, y: y2 }, end: { x: width - 40, y: y2 }, thickness: 0.75, color: rgb(0.2, 0.2, 0.2) });

  y2 -= 16;
  page2.drawText("Printed Name:", { x: 40, y: y2, size: 8.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page2.drawLine({ start: { x: 105, y: y2 - 1 }, end: { x: 330, y: y2 - 1 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

  // Page 2 Footer Initials
  page2.drawText("Tenant / Buyer Initials: [         ]", { x: 40, y: 35, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page2.drawText("Landlord / Seller Initials: [         ]", { x: 360, y: 35, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page2.drawText("Page 2 of 2", { x: width / 2 - 20, y: 35, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  return await doc.save();
}
