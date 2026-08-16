import { NextResponse } from "next/server";
import { runInvestigation } from "@/lib/assistant";
import type { ConversationTurn } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Vercel Hobby Fluid Compute maximum. */
export const maxDuration = 300;

function parseConversation(body: unknown): ConversationTurn[] {
  if (!body || typeof body !== "object") return [];

  if ("messages" in body && Array.isArray(body.messages)) {
    return body.messages.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const role =
        "role" in item && (item.role === "user" || item.role === "assistant")
          ? item.role
          : null;
      const content =
        "content" in item && typeof item.content === "string"
          ? item.content.trim()
          : "";
      if (!role || !content) return [];
      return [{ role, content }];
    });
  }

  if ("message" in body && typeof body.message === "string") {
    const message = body.message.trim();
    return message ? [{ role: "user", content: message }] : [];
  }

  return [];
}

export async function POST(request: Request) {
  const apiKey = process.env.FIREWORKS_API_KEY;
  const model = process.env.FIREWORKS_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json(
      { error: "Missing FIREWORKS_API_KEY or FIREWORKS_MODEL." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const conversation = parseConversation(body);
  const latest = conversation[conversation.length - 1];

  if (!latest || latest.role !== "user") {
    return NextResponse.json(
      { error: "Expected a `messages` array ending with a user turn." },
      { status: 400 }
    );
  }

  try {
    const result = await runInvestigation(conversation);
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Fireworks request failed.", detail },
      { status: 502 }
    );
  }
}
