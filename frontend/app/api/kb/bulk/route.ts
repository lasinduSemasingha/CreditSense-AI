import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "edge";

type IncomingDoc = { title?: string; content: string };
type StoredDoc = { id: string; title?: string | null; content: string };

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase env vars missing: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(supabaseUrl, serviceKey);
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { documents?: IncomingDoc[] };
    const documents = Array.isArray(body.documents) ? body.documents : [];

    if (!documents.length) {
      return new Response("documents array is required", { status: 400 });
    }

    // Simple guardrail to avoid very large single-batch inserts
    if (documents.length > 50) {
      return new Response("Max 50 documents per request", { status: 400 });
    }

    // Normalize input and drop empties
    const normalized = documents
      .map((doc) => ({
        content: (doc.content ?? "").trim(),
        title: (doc.title ?? "").trim(),
      }))
      .filter((doc) => doc.content.length > 0);

    if (!normalized.length) {
      return new Response("No valid documents to insert", { status: 400 });
    }

    const openai = getOpenAI();
    const embedInput = normalized.map((doc) => doc.content.replace(/\n/g, " "));
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: embedInput,
    });

    if (!embedRes.data || embedRes.data.length !== normalized.length) {
      return new Response("Embedding service returned unexpected result", { status: 500 });
    }

    const rows = normalized.map((doc, idx) => ({
      content: doc.content,
      title: doc.title || doc.content.slice(0, 80),
      embedding: embedRes.data[idx].embedding,
    }));

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("documents")
      .insert(rows)
      .select("id, content, title");

    if (error) {
      console.error("Supabase bulk insert error:", error);
      return new Response("Failed to insert documents", { status: 500 });
    }

    return Response.json((data ?? []) as StoredDoc[], { status: 201 });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}
