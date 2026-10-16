import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from "docx";
import type { InvoicePayload } from "@/pages/tools/InvoiceCreator";
import type { ResumePayload } from "@/pages/tools/ResumeBuilder";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Invoice to native Word .docx format
 */
export async function exportInvoiceToDocx(
  invoice: InvoicePayload,
  title: string = "invoice"
): Promise<void> {
  const currency = invoice.currency || "$";
  const subtotal = invoice.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax - invoice.discount;
  const depositPaid = invoice.depositPaid || 0;
  const balanceDue = Math.max(0, total - depositPaid);

  // Table header
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Description", bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Qty", bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Unit Price", bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Total", bold: true, size: 20 })],
            }),
          ],
        }),
      ],
    }),
  ];

  // Items
  for (const item of invoice.items) {
    const descText = item.sku ? `[${item.sku}] ${item.desc || "Item"}` : item.desc || "Item";
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: descText, size: 19 })] })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: String(item.qty), size: 19 })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `${currency}${item.price.toFixed(2)}`, size: 19 })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${currency}${(item.qty * item.price).toFixed(2)}`,
                    bold: true,
                    size: 19,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "INVOICE",
                bold: true,
                size: 40,
                color: "0F172A",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Invoice Date: ${invoice.invoiceDate || new Date().toISOString().slice(0, 10)}`,
                size: 20,
                color: "64748B",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Company & Client Details
          new Paragraph({
            children: [
              new TextRun({ text: "FROM: ", bold: true, size: 20, color: "0F172A" }),
              new TextRun({ text: invoice.companyName || "-", size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Phone: ", bold: true, size: 18, color: "64748B" }),
              new TextRun({ text: invoice.companyPhone || "-", size: 18, color: "64748B" }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: "BILL TO: ", bold: true, size: 20, color: "0F172A" }),
              new TextRun({ text: invoice.clientName || "-", size: 20 }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: invoice.clientAddress || "-", size: 18, color: "64748B" })],
          }),
          new Paragraph({ text: "" }),

          // Items Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          new Paragraph({ text: "" }),

          // Financial Summary
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Subtotal: `, bold: true, size: 20 }),
              new TextRun({ text: `${currency}${subtotal.toFixed(2)}`, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Tax (${invoice.taxRate}%): `, size: 20 }),
              new TextRun({ text: `${currency}${tax.toFixed(2)}`, size: 20 }),
            ],
          }),
          ...(invoice.discount > 0
            ? [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `Discount: `, size: 20 }),
                    new TextRun({ text: `-${currency}${invoice.discount.toFixed(2)}`, size: 20 }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Total: `, bold: true, size: 22 }),
              new TextRun({ text: `${currency}${total.toFixed(2)}`, bold: true, size: 22 }),
            ],
          }),
          ...(depositPaid > 0
            ? [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `Deposit / Paid: `, size: 20, color: "16A34A" }),
                    new TextRun({
                      text: `-${currency}${depositPaid.toFixed(2)}`,
                      bold: true,
                      size: 20,
                      color: "16A34A",
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `Balance Due: `, bold: true, size: 24, color: "2563EB" }),
                    new TextRun({
                      text: `${currency}${balanceDue.toFixed(2)}`,
                      bold: true,
                      size: 24,
                      color: "2563EB",
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({ text: "" }),

          // Terms & Notes
          new Paragraph({
            children: [
              new TextRun({ text: "Payment Terms: ", bold: true, size: 20 }),
              new TextRun({ text: invoice.paymentTerms || "-", size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Notes: ", bold: true, size: 20 }),
              new TextRun({ text: invoice.notes || "-", size: 20 }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${title.replace(/\s+/g, "_")}.docx`);
}

/**
 * Export Resume to native Word .docx format
 */
export async function exportResumeToDocx(
  resume: ResumePayload,
  title: string = "resume"
): Promise<void> {
  const font = resume.typography === "serif" ? "Georgia" : resume.typography === "mono" ? "Consolas" : "Calibri";
  
  const themeColors: Record<string, string> = {
    modern: "0284C7",
    classic: "334155",
    professionalBlue: "1E3A8A",
    minimalMonochrome: "0F172A",
    emerald: "059669",
  };
  const accentColor = themeColors[resume.theme] || "1E3A8A";

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: resume.layout === "modernSplit" ? AlignmentType.LEFT : AlignmentType.CENTER,
      children: [
        new TextRun({
          text: resume.fullName || "Candidate Name",
          bold: true,
          size: 34,
          font,
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      alignment: resume.layout === "modernSplit" ? AlignmentType.LEFT : AlignmentType.CENTER,
      children: [
        new TextRun({
          text: [resume.email, resume.phone, resume.location].filter(Boolean).join("  •  "),
          size: 19,
          font,
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  // Professional Summary
  if (resume.summary) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 21, font, color: accentColor })],
      }),
      new Paragraph({
        children: [new TextRun({ text: resume.summary, size: 20, font })],
      }),
      new Paragraph({ text: "" })
    );
  }

  // Work Experience
  if (resume.experience.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "WORK EXPERIENCE", bold: true, size: 21, font, color: accentColor })],
      })
    );

    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.role || "Role", bold: true, size: 20, font }),
            new TextRun({ text: ` | ${exp.company || "Company"}`, size: 20, font }),
            new TextRun({ text: ` (${exp.duration || "-"})`, italics: true, size: 18, font, color: "64748B" }),
          ],
        })
      );
      if (exp.highlights) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: exp.highlights, size: 19, font })],
          })
        );
      }
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Education
  if (resume.education.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "EDUCATION", bold: true, size: 21, font, color: accentColor })],
      })
    );

    for (const ed of resume.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ed.degree || "Degree", bold: true, size: 20, font }),
            new TextRun({ text: ` — ${ed.school || "School"}`, size: 20, font }),
            new TextRun({ text: ` (${ed.graduation || "-"})`, italics: true, size: 18, font, color: "64748B" }),
          ],
        })
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Key Projects
  if (resume.projects.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "KEY PROJECTS", bold: true, size: 21, font, color: accentColor })],
      })
    );

    for (const proj of resume.projects) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: proj.name || "Project", bold: true, size: 20, font })],
        }),
        new Paragraph({
          children: [new TextRun({ text: proj.details || "-", size: 19, font })],
        })
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Skills
  if (resume.skills) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "SKILLS & COMPETENCIES", bold: true, size: 21, font, color: accentColor })],
      }),
      new Paragraph({
        children: [new TextRun({ text: resume.skills, size: 20, font })],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${title.replace(/\s+/g, "_")}.docx`);
}
