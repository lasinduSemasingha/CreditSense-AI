import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";
const MAX_CHARS = 12000;

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data with 'file'" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    if (ext === "pdf") {
      try {
        const parsed = await pdfParse(buffer);
        text = parsed.text;
      } catch (pdfErr: any) {
        // Some PDFs have non-standard/corrupt XRef tables — retry with rendering disabled
        try {
          const parsed = await pdfParse(buffer, { max: 0 });
          text = parsed.text;
        } catch {
          const msg: string = pdfErr?.message || String(pdfErr);
          const isFormat = /xref|xobject|bad|format|corrupt|password/i.test(msg);
          return NextResponse.json(
            {
              error: isFormat
                ? "This PDF could not be read. It may be corrupted, password-protected, or in an unsupported format. Try saving it as a new PDF and uploading again."
                : "PDF extraction failed",
              details: msg,
            },
            { status: 422 }
          );
        }
      }
    } else if (ext === "docx" || ext === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (["txt", "csv", "md", "json"].includes(ext)) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}. Supported: pdf, docx, doc, txt, csv, md, json` },
        { status: 400 }
      );
    }

    // Trim and cap length to avoid huge prompts
    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n\n[Document truncated due to length...]";
    }

    return NextResponse.json({ text, filename });
  } catch (err: any) {
    console.error("extract-document error:", err);
    return NextResponse.json(
      { error: "Document extraction failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
