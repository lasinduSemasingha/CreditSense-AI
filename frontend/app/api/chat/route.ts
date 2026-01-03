// app/api/chat/route.ts

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Edge-friendly OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Run this route on the Edge runtime
export const runtime = "edge";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  // 1) Read chat messages and extract the user's latest question
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  const lastUserMessage = [...(messages ?? [])]
    .reverse()
    .find((m) => m.role === "user");

  const userQuery = lastUserMessage?.content?.trim();
  if (!userQuery) {
    return new Response("No user message provided.", { status: 400 });
  }

  // 2) Create an embedding from the user's query
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: userQuery.replace(/\n/g, " "),
  });

  const embedding = embeddingRes.data?.[0]?.embedding;
  if (!embedding) {
    return new Response("Failed to create embedding for the question.", {
      status: 500,
    });
  }

  // 3) Query Supabase for relevant documents using an RPC function
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      "Supabase environment variables are not configured (URL or SERVICE_ROLE_KEY).",
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const matchThreshold = Number.parseFloat(
    process.env.KB_MATCH_THRESHOLD ?? ""
  );
  const matchCount = Number.parseInt(process.env.KB_MATCH_COUNT ?? "", 10);

  const effectiveThreshold = Number.isFinite(matchThreshold)
    ? matchThreshold
    : 0.5;
  const effectiveCount = Number.isFinite(matchCount) ? matchCount : 5;

  const { data: documents, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: effectiveThreshold,
    match_count: effectiveCount,
  });

  if (error) {
    console.error("Supabase RPC match_documents error:", error);
    return new Response("Supabase retrieval failed.", { status: 500 });
  }

  const contextText = (documents ?? [])
    .map((doc: any) => `- ${doc?.content?.trim?.() ?? ""}`)
    .filter(Boolean)
    .join("\n");

  // 4) Build the model messages with context + conversation
  // !v1
  // const systemPrompt = [
  //   "You are a helpful assistant for answering questions from a knowledge base.",
  //   "Use ONLY the provided context sections to answer.",
  //   "If the answer is not explicitly in the context, respond: 'Sorry, I don't know how to help with that.'",
  //   "Be concise and cite facts from the context in your own words when possible.",
  // ].join(" ");

  // !v2
  const systemPrompt = [
    "You are Mahee, a friendly and professional AI-driven conversational assistant for automated customer inquiries in motorcycle leasing.",
    "Persona: approachable, concise, and helpful—like a knowledgeable leasing specialist. Use plain language, keep answers short, and use bullet points when useful.",
    "Primary goal: help riders understand leasing options, eligibility, pricing factors, required documents, application steps, payment schedules, end-of-lease choices, maintenance/insurance basics, and support contacts.",
    "Grounding: Prefer ONLY the provided context sections for policies, numbers, terms, and processes.",
    "If a factual answer is not explicitly in the context, say: \"Sorry, I don't know how to help with that.\" You may offer to check a different query or ask for more details.",
    "Exception for small talk: You may answer simple greetings (e.g., 'hi', 'hello', 'how are you') and brief rapport-building questions even without context. Keep it short and gently guide the user toward motorcycle leasing help.",
    "Ask one clarifying question first when the request is ambiguous or missing key details.",
    "Never fabricate policy details, prices, eligibility rules, or contact info.",
    "Be concise and, when possible, paraphrase relevant facts from the context in your own words.",
  ].join(" ");

  // !v3
  // const systemPrompt = [
  //   "You are Mahee, a friendly and professional AI-driven conversational assistant for automated customer inquiries in motorcycle leasing.",
  //   "Persona: approachable, concise, and helpful—like a knowledgeable leasing specialist. Use plain language, keep answers short, and use bullet points when useful.",
  //   "Primary goal: help riders understand leasing options, eligibility, pricing factors, required documents, application steps, payment schedules, end-of-lease choices, maintenance/insurance basics, and support contacts.",
  //   "Scope: If the knowledge base context contains information not directly related to motorcycle leasing, you may answer it as long as you stay grounded in the provided context.",
  //   "Grounding: Use ONLY the provided context sections for policies, numbers, terms, processes, or any factual claims.",
  //   "If a factual answer is not explicitly in the context, say: \"Sorry, I don't know how to help with that.\" You may offer to check a different query or ask for more details.",
  //   "Exception for small talk: You may answer simple greetings (e.g., 'hi', 'hello', 'how are you') and brief rapport-building questions even without context. Keep it short and gently guide the user toward motorcycle leasing help.",
  //   "Ask one clarifying question first when the request is ambiguous or missing key details.",
  //   "Never fabricate policy details, prices, eligibility rules, or contact info.",
  //   "Be concise and, when possible, paraphrase relevant facts from the context in your own words.",
  // ].join(" ");

  const contextMessage: ChatMessage = {
    role: "system",
    content: `Context sections:\n${contextText || "(no relevant context found)"}`,
  };

  // Preserve the conversation (excluding any existing system messages)
  const conversation = (messages ?? []).filter((m) => m.role !== "system");

  // Optional: debugging payload (do not stream)
  if (debug) {
    return Response.json({
      userQuery,
      embeddingDims: Array.isArray(embedding) ? embedding.length : null,
      retrieved: (documents ?? []).length,
      top: (documents ?? [])
        .slice(0, 5)
        .map((d: any) => ({ id: d?.id, similarity: d?.similarity })),
      threshold: effectiveThreshold,
      count: effectiveCount,
      hasContextText: Boolean(contextText),
    });
  }

  // 5) Stream a chat completion from OpenAI using the official SDK
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            contextMessage,
            ...conversation,
          ],
        });

        for await (const part of completion) {
          const delta = part.choices?.[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (err) {
        console.error("OpenAI streaming error:", err);
        controller.enqueue(
          encoder.encode("Sorry, I couldn't generate an answer right now.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
