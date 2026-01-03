import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Missing DEEPGRAM_API_KEY" },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // Support both direct binary body and multipart/form-data
    let audioBuffer: ArrayBuffer | null = null;
    let mimeType = "audio/webm";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      audioBuffer = await file.arrayBuffer();
      mimeType = file.type || mimeType;
    } else {
      audioBuffer = await req.arrayBuffer();
      const reqContentType = req.headers.get("content-type");
      if (reqContentType) mimeType = reqContentType;
    }

    if (!audioBuffer) {
      return NextResponse.json({ error: "No audio received" }, { status: 400 });
    }

    const dgRes = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": mimeType,
        Accept: "application/json",
      },
      body: audioBuffer,
      // For pre-recorded audio, consider adding query params like model or smart_format
      // e.g., url: "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
    });

    if (!dgRes.ok) {
      const text = await dgRes.text();
      return NextResponse.json(
        { error: "Deepgram request failed", details: text },
        { status: 502 }
      );
    }

    const json = await dgRes.json();
    // Safely access transcript
    const transcript =
      json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    return NextResponse.json({ transcript });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Transcription error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
