"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

interface Card {
  id: string;
  front: string;
  back: string;
  answer_type: string;
  explanation: string | null;
  tok_connection: string | null;
  decks: { subject: string; name: string } | null;
}

export default function CardAuditor() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const supabase = createClient();

  useEffect(() => { loadCards(); }, [subjectFilter]);

  async function loadCards() {
    setLoading(true);
    let query = supabase
      .from("cards")
      .select("id, front, back, answer_type, explanation, tok_connection, decks(subject, name)")
      .order("created_at", { ascending: false });

    if (subjectFilter !== "all") {
      query = supabase
        .from("cards")
        .select("id, front, back, answer_type, explanation, tok_connection, decks!inner(subject, name)")
        .eq("decks.subject", subjectFilter)
        .order("created_at", { ascending: false });
    }

    const { data } = await query;
    setCards((data as unknown as Card[]) || []);
    setPage(0);
    setLoading(false);
  }

  function startEdit(card: Card) {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  async function saveEdit(id: string) {
    await supabase.from("cards").update({ front: editFront, back: editBack }).eq("id", id);
    setEditingId(null);
    loadCards();
  }

  async function deleteCard(id: string) {
    if (!confirm("Delete this card permanently?")) return;
    await supabase.from("cards").delete().eq("id", id);
    loadCards();
  }

  const filtered = cards.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q);
  });

  const pageCards = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Card Auditor</h2>
      <p className="text-sm text-gray-500 mb-4">{filtered.length} cards · Preview, edit, or delete cards for correctness</p>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        {["all", "spanish", "biology", "english", "math"].map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize ${subjectFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
        placeholder="Search cards..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-4"
      />

      {/* Card list */}
      <div className="space-y-2">
        {pageCards.map((card) => (
          <div key={card.id} className="rounded-lg border border-gray-200 bg-white p-3">
            {editingId === card.id ? (
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Front:</label>
                <textarea
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                  rows={2}
                />
                <label className="text-xs text-gray-500">Back:</label>
                <textarea
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(card.id)} className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-medium">Save</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">{card.decks?.subject}</span>
                      <span className="text-xs text-gray-400">{card.answer_type}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{card.front}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{card.back}</p>
                    {!card.tok_connection && <span className="text-xs text-amber-500 mt-1 inline-block">Missing TOK</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(card)} className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50">Edit</button>
                    <button onClick={() => deleteCard(card.id)} className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50">Del</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-700 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-700 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
