import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "edge";

type Doc = {
  id: string;
  content: string;
  title?: string | null;
};

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

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("documents")
      .select("id, content, title");

    if (error) {
      console.error("Supabase GET error:", error);
      return new Response("Failed to fetch documents", { status: 500 });
    }

    return Response.json((data ?? []) as Doc[]);
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { content, title } = (await req.json()) as { content?: string; title?: string };
    const text = (content ?? "").trim();
    const docTitle = (title ?? "").trim();
    if (!text) return new Response("Content is required", { status: 400 });

    const openai = getOpenAI();
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, " "),
    });
    const embedding = embedRes.data?.[0]?.embedding;
    if (!embedding) {
      return new Response("Failed to create embedding", { status: 500 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("documents")
      .insert({ content: text, title: docTitle, embedding })
      .select("id, content, title")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response("Failed to insert document", { status: 500 });
    }

    return Response.json(data as Doc, { status: 201 });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error);
      return new Response("Failed to delete document", { status: 500 });
    }

    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: unknown;
      content?: unknown;
      title?: unknown;
    };

    const docId = String(body.id ?? "").trim();
    const text = typeof body.content === "string" ? body.content.trim() : "";
    const docTitle =
      typeof body.title === "string" ? body.title.trim() : null;

    if (!docId) return new Response("id is required", { status: 400 });

    const supabase = getSupabase();

    // If content provided, update content + embedding (and title if given).
    if (text) {
      const openai = getOpenAI();
      const embedRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      const embedding = embedRes.data?.[0]?.embedding;
      if (!embedding) {
        return new Response("Failed to create embedding", { status: 500 });
      }

      const { data, error } = await supabase
        .from("documents")
        .update({ content: text, title: docTitle, embedding })
        .eq("id", docId)
        .select("id, content, title")
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        return new Response("Failed to update document", { status: 500 });
      }
      return Response.json(data as Doc, { status: 200 });
    }

    // Only title change (no embedding recompute)
    if (docTitle !== null) {
      const { data, error } = await supabase
        .from("documents")
        .update({ title: docTitle })
        .eq("id", docId)
        .select("id, content, title")
        .single();
      if (error) {
        console.error("Supabase update error:", error);
        return new Response("Failed to update document", { status: 500 });
      }
      return Response.json(data as Doc, { status: 200 });
    }

    return new Response("No fields to update", { status: 400 });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}
