import { NextResponse } from "next/server";

// Map OpenAI voice names to Deepgram Aura voices
const VOICE_MAP: Record<string, string> = {
  alloy: "aura-asteria-en",
  echo: "aura-orion-en",
  fable: "aura-arcas-en",
  onyx: "aura-zeus-en",
  nova: "aura-luna-en",
  shimmer: "aura-stella-en",
};

export async function POST(req: Request) {
  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Missing DEEPGRAM_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = (body?.text as string) || "";
    const voiceInput = (body?.voice as string) || "alloy";

    if (!text.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const dgVoice = VOICE_MAP[voiceInput] ?? "aura-asteria-en";

    const resp = await fetch(
      `https://api.deepgram.com/v1/speak?model=${dgVoice}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: "TTS failed", details: errText },
        { status: 502 }
      );
    }

    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    return NextResponse.json({ audioBase64, format: "mp3" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "TTS error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
