"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import AudioButton from "./study/AudioButton";

interface Card {
  id: string;
  front: string;
  back: string;
  answer_type: string;
  explanation: string | null;
  real_world_connection: string | null;
  tok_connection: string | null;
  interdisciplinary: string | null;
  inquiry_question: string | null;
  image_url: string | null;
  audio_lang: string | null;
  decks: { subject: string; name: string } | null;
}

export default function CardAuditor() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [view, setView] = useState<"browse" | "issues">("browse");
  const [issues, setIssues] = useState<{ cardId: string; front: string; subject: string; issue: string; severity: string }[]>([]);
  const [auditSummary, setAuditSummary] = useState<{ errors: number; warnings: number; clean: number } | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<{ cardId: string; front: string; back: string; explanation: string } | null>(null);
  const supabase = createClient();

  useEffect(() => { loadCards(); }, [subjectFilter]);

  async function runAudit() {
    const res = await fetch("/api/audit");
    const data = await res.json();
    setIssues(data.issues || []);
    setAuditSummary(data.summary || null);
    setView("issues");
  }

  async function fixWithAI(issue: { cardId: string; front: string; subject: string; issue: string }) {
    setFixingId(issue.cardId);
    setSuggestedFix(null);
    const card = cards.find((c) => c.id === issue.cardId);
    if (!card) return;

    const res = await fetch("/api/audit-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card: { front: card.front, back: card.back, subject: card.decks?.subject }, issue: issue.issue }),
    });
    const data = await res.json();
    if (data.fix) {
      setSuggestedFix({ ...data.fix, cardId: issue.cardId });
    }
    setFixingId(null);
  }

  async function applyFix(cardId: string) {
    if (!suggestedFix) return;
    await supabase.from("cards").update({ front: suggestedFix.front, back: suggestedFix.back }).eq("id", cardId);
    setSuggestedFix(null);
    loadCards();
    runAudit();
  }

  async function loadCards() {
    setLoading(true);
    let query = supabase
      .from("cards")
      .select("id, front, back, answer_type, explanation, real_world_connection, tok_connection, interdisciplinary, inquiry_question, image_url, audio_lang, decks(subject, name)")
      .order("created_at", { ascending: false });

    if (subjectFilter !== "all") {
      query = supabase
        .from("cards")
        .select("id, front, back, answer_type, explanation, real_world_connection, tok_connection, interdisciplinary, inquiry_question, image_url, audio_lang, decks!inner(subject, name)")
        .eq("decks.subject", subjectFilter)
        .order("created_at", { ascending: false });
    }

    const { data } = await query;
    setCards((data as unknown as Card[]) || []);
    setCurrentIndex(0);
    setFlipped(false);
    setEditMode(false);
    setLoading(false);
  }

  const filtered = cards.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q);
  });

  const currentCard = filtered[currentIndex];

  function goNext() {
    if (currentIndex < filtered.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setEditMode(false);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setEditMode(false);
    }
  }

  function startEdit() {
    if (!currentCard) return;
    setEditFront(currentCard.front);
    setEditBack(currentCard.back);
    setEditMode(true);
  }

  async function saveEdit() {
    if (!currentCard) return;
    await supabase.from("cards").update({ front: editFront, back: editBack }).eq("id", currentCard.id);
    setEditMode(false);
    loadCards();
  }

  async function deleteCard() {
    if (!currentCard) return;
    if (!confirm("Delete this card permanently?")) return;
    await supabase.from("cards").delete().eq("id", currentCard.id);
    loadCards();
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Card Auditor</h2>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("browse")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${view === "browse" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Browse Cards
        </button>
        <button
          onClick={() => { runAudit(); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${view === "issues" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Run Audit
        </button>
      </div>

      {view === "issues" && (
        <div className="mb-4">
          {auditSummary && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-700">{auditSummary.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-700">{auditSummary.warnings}</div>
                <div className="text-xs text-gray-500">Warnings</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-700">{auditSummary.clean}</div>
                <div className="text-xs text-gray-500">Clean</div>
              </div>
            </div>
          )}

          {issues.length === 0 && <p className="text-center text-green-600 py-6 text-sm font-medium">All cards pass audit!</p>}

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {issues.slice(0, 50).map((issue, i) => (
              <div key={`${issue.cardId}-${i}`} className={`rounded-lg border p-3 ${issue.severity === "error" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${issue.severity === "error" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>{issue.severity}</span>
                      <span className="text-xs text-gray-500 capitalize">{issue.subject}</span>
                    </div>
                    <p className="text-sm text-gray-900 truncate">{issue.front}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{issue.issue}</p>
                  </div>
                  <button
                    onClick={() => fixWithAI(issue)}
                    disabled={fixingId === issue.cardId}
                    className="shrink-0 px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                  >
                    {fixingId === issue.cardId ? "..." : "Fix AI"}
                  </button>
                </div>

                {suggestedFix && suggestedFix.cardId === issue.cardId && (
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <p className="text-xs text-gray-500 mb-1">Suggested fix:</p>
                    <p className="text-xs font-medium text-gray-900">Front: {suggestedFix.front}</p>
                    <p className="text-xs text-gray-700">Back: {suggestedFix.back}</p>
                    <p className="text-xs text-purple-600 italic mt-1">{suggestedFix.explanation}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => applyFix(issue.cardId)} className="px-2 py-1 rounded text-xs bg-green-600 text-white">Apply</button>
                      <button onClick={() => setSuggestedFix(null)} className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">Dismiss</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {issues.length > 50 && <p className="text-xs text-gray-400 text-center mt-2">Showing first 50 of {issues.length} issues</p>}
        </div>
      )}

      {view === "browse" && (
        <>
      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        {["all", "spanish", "biology", "english", "math"].map((s) => (
          <button
            key={s}
            onClick={() => { setSubjectFilter(s); setCurrentIndex(0); }}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize ${subjectFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}
          >
            {s} {s === "all" ? `(${cards.length})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); setFlipped(false); }}
        placeholder="Search cards..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-4"
      />

      {/* Card counter */}
      <p className="text-xs text-gray-500 mb-3 text-center">
        Card {filtered.length > 0 ? currentIndex + 1 : 0} of {filtered.length}
      </p>

      {/* Flashcard Preview */}
      {currentCard && !editMode && (
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-full rounded-xl border border-gray-200 bg-white shadow-sm p-6 min-h-[250px] flex flex-col items-center justify-center cursor-pointer mb-4"
        >
          {!flipped ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{currentCard.decks?.subject}</span>
                <span className="text-xs text-gray-400">{currentCard.answer_type}</span>
              </div>
              {currentCard.image_url && (
                <img src={currentCard.image_url} alt="" className="w-full max-w-[180px] h-auto rounded-lg" />
              )}
              <h2 className="text-xl font-bold text-gray-900 text-center">{currentCard.front}</h2>
              {currentCard.audio_lang && currentCard.decks?.subject === "spanish" && (
                <AudioButton text={currentCard.front} lang={currentCard.audio_lang} />
              )}
              <p className="text-xs text-gray-400 mt-2">Tap to flip</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <p className="text-xl font-bold text-gray-900 text-center">{currentCard.back}</p>
              {currentCard.explanation && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                  <p className="text-xs font-medium text-red-800 mb-1">Explanation</p>
                  <p className="text-xs text-red-700">{currentCard.explanation}</p>
                </div>
              )}
              {currentCard.real_world_connection && (
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-blue-800 mb-1">Real-world</p>
                  <p className="text-xs text-blue-700">{currentCard.real_world_connection}</p>
                </div>
              )}
              {currentCard.tok_connection && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-amber-800 mb-1">TOK</p>
                  <p className="text-xs text-amber-700">{currentCard.tok_connection}</p>
                </div>
              )}
              {currentCard.interdisciplinary && (
                <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-purple-800 mb-1">Across subjects</p>
                  <p className="text-xs text-purple-700">{currentCard.interdisciplinary}</p>
                </div>
              )}
              {currentCard.inquiry_question && (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-green-800 mb-1">Think deeper</p>
                  <p className="text-xs text-green-700 italic">{currentCard.inquiry_question}</p>
                </div>
              )}
              {!currentCard.tok_connection && (
                <span className="text-xs text-amber-500 mt-1">⚠️ Missing TOK enrichment</span>
              )}
              <p className="text-xs text-gray-400 mt-2">Tap to flip back</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {currentCard && editMode && (
        <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4 space-y-3">
          <label className="text-xs font-medium text-gray-700">Front:</label>
          <textarea
            value={editFront}
            onChange={(e) => setEditFront(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            rows={3}
          />
          <label className="text-xs font-medium text-gray-700">Back:</label>
          <textarea
            value={editBack}
            onChange={(e) => setEditBack(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium">Save</button>
            <button onClick={() => setEditMode(false)} className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Navigation + Actions */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrev} disabled={currentIndex === 0} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-30">← Prev</button>
          <div className="flex gap-2">
            <button onClick={startEdit} className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">Edit</button>
            <button onClick={deleteCard} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-medium">Delete</button>
          </div>
          <button onClick={goNext} disabled={currentIndex >= filtered.length - 1} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-30">Next →</button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">No cards found.</p>
      )}
        </>
      )}
    </div>
  );
}
