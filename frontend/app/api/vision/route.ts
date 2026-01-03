import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = file.type || "image/png";
    const dataUrl = `data:${mime};base64,${base64}`;

    const prompt =
      "Describe this image in a short, helpful sentence or two for a motorcycle leasing assistant. Keep it concise.";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this image." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: "OpenAI vision failed", details: errText },
        { status: 502 }
      );
    }

    const json = await resp.json();
    const description =
      json?.choices?.[0]?.message?.content?.trim?.() || "";

    return NextResponse.json({ description });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Vision error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
