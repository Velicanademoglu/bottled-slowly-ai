import { Router } from "express";
import { z } from "zod";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { prisma } from "../../db.js";
import type { AuthRequest } from "../../auth.js";
import { logAdminAction } from "../../services/audit.js";

const router = Router();

const statusSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
});

router.get("/", async (_req: AuthRequest, res) => {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      initiator: { select: { id: true, username: true, email: true } },
      target: { select: { id: true, username: true, email: true } },
    },
  });
  res.json({ reports });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid report id" });
    return;
  }
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      initiator: { select: { id: true, username: true, email: true } },
      target: { select: { id: true, username: true, email: true } },
    },
  });
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(report);
});

function buildReportDoc(reports: { id: number; category: string; description: string | null; status: string; createdAt: Date; updatedAt: Date; initiator: { username: string; email: string }; target: { username: string; email: string } }[]) {
  const children = [
    new Paragraph({
      text: "PROJECT STAR - Report Summary",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  for (const report of reports) {
    children.push(
      new Paragraph({
        text: `Report #${report.id} - ${report.category}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({ children: [new TextRun({ text: "Status: ", bold: true }), new TextRun(report.status)] }),
      new Paragraph({ children: [new TextRun({ text: "Reported by: ", bold: true }), new TextRun(`${report.initiator.username} (${report.initiator.email})`)] }),
      new Paragraph({ children: [new TextRun({ text: "Target: ", bold: true }), new TextRun(`${report.target.username} (${report.target.email})`)] }),
      new Paragraph({ children: [new TextRun({ text: "Created: ", bold: true }), new TextRun(report.createdAt.toLocaleString())] }),
      new Paragraph({ children: [new TextRun({ text: "Updated: ", bold: true }), new TextRun(report.updatedAt.toLocaleString())] }),
      new Paragraph({ children: [new TextRun({ text: "Description:", bold: true })], spacing: { before: 100 } }),
      new Paragraph({ text: report.description || "No description provided.", spacing: { after: 200 } })
    );
  }

  return new Document({ sections: [{ children }] });
}

router.get("/:id/docx", async (req: AuthRequest, res) => {
  const adminId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid report id" });
    return;
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      initiator: { select: { username: true, email: true } },
      target: { select: { username: true, email: true } },
    },
  });
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  await logAdminAction(adminId, "download_report_docx", "report", String(id));

  const doc = buildReportDoc([report]);
  const buffer = await Packer.toBuffer(doc);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="report-${report.id}.docx"`);
  res.send(buffer);
});

router.get("/export/docx", async (req: AuthRequest, res) => {
  const adminId = req.userId!;
  const status = String(req.query.status || "");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      initiator: { select: { username: true, email: true } },
      target: { select: { username: true, email: true } },
    },
  });

  await logAdminAction(adminId, "download_reports_export_docx", "report", "all");

  const doc = buildReportDoc(reports);
  const buffer = await Packer.toBuffer(doc);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="reports-export-${Date.now()}.docx"`);
  res.send(buffer);
});

router.post("/:id/status", async (req: AuthRequest, res) => {
  const adminId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid report id" });
    return;
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const report = await prisma.report.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await logAdminAction(adminId, "update_report_status", "report", String(id), JSON.stringify({ status: parsed.data.status }));

  res.json(report);
});

export default router;
