import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface AuditIssue {
  cardId: string;
  front: string;
  subject: string;
  issue: string;
  severity: "error" | "warning";
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: cards } = await supabase
    .from("cards")
    .select("id, front, back, answer_type, explanation, real_world_connection, tok_connection, interdisciplinary, inquiry_question, decks(subject)")
    .order("created_at", { ascending: false });

  if (!cards) return NextResponse.json({ issues: [], total: 0 });

  const issues: AuditIssue[] = [];

  for (const card of cards) {
    const subject = (card as any).decks?.subject || "unknown";
    const front = card.front || "";
    const back = card.back || "";

    // Missing TOK
    if (!card.tok_connection) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Missing TOK connection", severity: "warning" });
    }

    // Missing real-world connection
    if (!card.real_world_connection) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Missing real-world connection", severity: "warning" });
    }

    // Missing interdisciplinary
    if (!card.interdisciplinary) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Missing interdisciplinary connection", severity: "warning" });
    }

    // Missing inquiry question
    if (!card.inquiry_question) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Missing inquiry question", severity: "warning" });
    }

    // Front too long (>200 chars — not atomic)
    if (front.length > 200) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: `Front too long (${front.length} chars) — may not be atomic`, severity: "error" });
    }

    // Back too long (>300 chars — should be split)
    if (back.length > 300) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: `Back too long (${back.length} chars) — should be split`, severity: "error" });
    }

    // Empty front or back
    if (!front.trim() || !back.trim()) {
      issues.push({ cardId: card.id, front: front.slice(0, 60) || "(empty)", subject, issue: "Empty front or back", severity: "error" });
    }

    // HTML artifacts — but not math inequalities like < or >
    const hasHtml = front.includes("&nbsp;") || back.includes("&nbsp;") ||
      /&[a-z]+;/i.test(front) || /&[a-z]+;/i.test(back) ||
      /<\/?[a-z][a-z0-9]*[\s>]/i.test(front) || /<\/?[a-z][a-z0-9]*[\s>]/i.test(back);
    if (hasHtml) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Contains HTML artifacts (&nbsp; or tags)", severity: "error" });
    }

    // Front equals back
    if (front.trim().toLowerCase() === back.trim().toLowerCase()) {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Front and back are identical", severity: "error" });
    }

    // Definition-style prompt — only flag if it's a very simple one-word term
    // "What is IVF?" is fine. "What is a monomial?" when subject is math could be better.
    if (front.match(/^What is (a |the |an )?[a-z]{3,15}\??$/i) && subject === "math") {
      issues.push({ cardId: card.id, front: front.slice(0, 60), subject, issue: "Math card with bare definition prompt — consider rewriting as application", severity: "warning" });
    }

    // Non-Spanish card with audio speaker icon issue (audio_lang set)
    // This is just informational, not really an error anymore since we fixed it in UI
  }

  // Summary by severity
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return NextResponse.json({
    total: cards.length,
    issues,
    summary: { errors, warnings, clean: cards.length - new Set(issues.map((i) => i.cardId)).size },
  });
}
