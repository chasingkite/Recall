"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase/client";

interface ImportedCard {
  front: string;
  back: string;
  subject: string;
  answerType: string;
  explanation?: string;
  tokConnection?: string;
  interdisciplinary?: string;
  inquiryQuestion?: string;
  realWorldConnection?: string;
  enrichError?: boolean;
}

const SUBJECTS = ["spanish", "biology", "english", "math", "science", "history", "reading"];

export default function ImportDeck() {
  const [step, setStep] = useState<"upload" | "preview" | "enriching" | "done">("upload");
  const [rawCards, setRawCards] = useState<ImportedCard[]>([]);
  const [enrichedCards, setEnrichedCards] = useState<ImportedCard[]>([]);
  const [subject, setSubject] = useState("spanish");
  const [deckName, setDeckName] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function parseCSV(text: string): { front: string; back: string }[] {
    const lines = text.trim().split("\n");
    const cards: { front: string; back: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Try tab-separated (Anki default export)
      if (line.includes("\t")) {
        const [front, back] = line.split("\t");
        if (front && back) cards.push({ front: front.trim(), back: back.trim() });
        continue;
      }

      // Try comma-separated (with possible quotes)
      const match = line.match(/^"?([^"]*)"?\s*[,;]\s*"?([^"]*)"?$/);
      if (match) {
        cards.push({ front: match[1].trim(), back: match[2].trim() });
        continue;
      }

      // Try pipe-separated
      if (line.includes("|")) {
        const [front, back] = line.split("|");
        if (front && back) cards.push({ front: front.trim(), back: back.trim() });
      }
    }

    return cards;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No cards found. Use format: front,back or front\\tback (one per line)");
        return;
      }
      setRawCards(parsed.map((c) => ({ ...c, subject, answerType: "type" })));
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function handlePaste(text: string) {
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      setError("No cards found. Use format: front,back or front\\tback (one per line)");
      return;
    }
    setRawCards(parsed.map((c) => ({ ...c, subject, answerType: "type" })));
    setStep("preview");
  }

  async function enrichCards() {
    setStep("enriching");
    setProgress(0);

    const batchSize = 3;
    const results: ImportedCard[] = [];

    for (let i = 0; i < rawCards.length; i += batchSize) {
      const batch = rawCards.slice(i, i + batchSize);
      try {
        const res = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cards: batch }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Enrich batch failed: ${res.status} ${errText}`);
          results.push(...batch.map((c) => ({ ...c, enrichError: true })));
        } else {
          const data = await res.json();
          results.push(...data.cards);
        }
      } catch (err) {
        console.error("Enrich fetch error:", err);
        results.push(...batch.map((c) => ({ ...c, enrichError: true })));
      }
      setProgress(Math.min(100, Math.round(((i + batchSize) / rawCards.length) * 100)));
    }

    setEnrichedCards(results);
    setStep("done");
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(enrichedCards, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName || "deck"}-enriched.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (step === "upload") {
    return (
      <div className="w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Import Deck</h2>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 block mb-1">Deck Name</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g. Spanish 1 - Chapter 3"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 block mb-1">Subject</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`text-xs px-3 py-1.5 rounded-full border capitalize ${subject === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 block mb-2">Upload CSV/TSV file</label>
          <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <span className="text-2xl block mb-2">📄</span>
            <span className="text-sm text-gray-600">Drop file or click to upload</span>
            <span className="text-xs text-gray-400 block mt-1">Supports: Anki export (TSV), CSV, pipe-separated</span>
            <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or paste directly</span></div>
        </div>

        <div className="mb-4">
          <textarea
            placeholder={"Paste cards here (one per line):\nhola\\thello\ngato\\tcat\nperro\\tdog"}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
            onBlur={(e) => e.target.value && handlePaste(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Formats: tab-separated, comma-separated, or pipe-separated (front|back)</p>
        </div>

        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Preview ({rawCards.length} cards)</h2>
        <p className="text-xs text-gray-500 mb-4">Subject: <span className="capitalize font-medium">{subject}</span> · Deck: {deckName || "Untitled"}</p>

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg mb-4">
          {rawCards.map((c, i) => (
            <div key={i} className="flex border-b border-gray-100 px-3 py-2 text-xs">
              <span className="flex-1 text-gray-900 font-medium">{c.front}</span>
              <span className="flex-1 text-gray-500">{c.back}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("upload")}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium"
          >
            Back
          </button>
          <button
            onClick={enrichCards}
            className="flex-1 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Enrich with AI ({rawCards.length} cards)
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">~${(rawCards.length * 0.01).toFixed(2)} estimated cost</p>
      </div>
    );
  }

  if (step === "enriching") {
    return (
      <div className="w-full flex flex-col items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm font-medium text-gray-900 mb-2">Generating TOK & interdisciplinary content...</p>
        <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
      </div>
    );
  }

  if (step === "done") {
    const successCount = enrichedCards.filter((c) => !c.enrichError).length;

    async function saveToSupabase() {
      setSaving(true);
      const supabase = createClient();

      // Create deck
      const { data: deck, error: deckError } = await supabase
        .from("decks")
        .insert({ name: deckName || "Imported Deck", subject })
        .select()
        .single();

      if (deckError || !deck) {
        setSaving(false);
        alert("Failed to create deck: " + (deckError?.message || "unknown error"));
        return;
      }

      // Dedup: fetch existing card fronts for this subject
      const { data: existingCards } = await supabase
        .from("cards")
        .select("front, decks!inner(subject)")
        .eq("decks.subject", subject);

      const existingFronts = new Set(
        (existingCards || []).map((c: { front: string }) => c.front.toLowerCase().trim())
      );

      // Filter out duplicates and errors
      const cardsToInsert = enrichedCards
        .filter((c) => !c.enrichError)
        .filter((c) => !existingFronts.has(c.front.toLowerCase().trim()))
        .map((c) => ({
          deck_id: deck.id,
          front: c.front,
          back: c.back,
          answer_type: c.answerType || "type",
          explanation: c.explanation || null,
          real_world_connection: c.realWorldConnection || null,
          tok_connection: c.tokConnection || null,
          interdisciplinary: c.interdisciplinary || null,
          inquiry_question: c.inquiryQuestion || null,
          audio_lang: subject === "spanish" ? "es-ES" : "en-US",
        }));

      const skippedCount = enrichedCards.filter((c) => !c.enrichError).length - cardsToInsert.length;

      if (cardsToInsert.length === 0) {
        setSaving(false);
        alert(`All ${skippedCount} cards already exist in this subject. Nothing to import.`);
        return;
      }

      const { error: cardsError } = await supabase.from("cards").insert(cardsToInsert);

      if (cardsError) {
        setSaving(false);
        alert("Failed to save cards: " + cardsError.message);
        return;
      }

      setSaving(false);
      setSaved(true);
      if (skippedCount > 0) {
        alert(`Saved ${cardsToInsert.length} cards. Skipped ${skippedCount} duplicates.`);
      }
    }

    async function runCorrectnessCheck() {
      const cardsToCheck = enrichedCards
        .filter((c) => !c.enrichError)
        .map((c) => ({ id: c.front, front: c.front, back: c.back, subject }));

      const res = await fetch("/api/audit-correctness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: cardsToCheck }),
      });
      const data = await res.json();
      if (data.incorrect > 0) {
        alert(`AI found ${data.incorrect} potentially incorrect cards. Check the Audit tab for details.`);
      } else {
        alert("All cards passed AI correctness check!");
      }
    }

    return (
      <div className="w-full">
        <div className="text-center py-6">
          <div className="text-4xl mb-3">{saved ? "🎉" : "✅"}</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{saved ? "Saved to Recall!" : "Deck Enriched!"}</h2>
          <p className="text-sm text-gray-500">
            {saved
              ? `${successCount} cards saved to database — ready to study!`
              : `${successCount}/${enrichedCards.length} cards enriched with TOK, interdisciplinary, and inquiry content`
            }
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg mb-4">
          {enrichedCards.map((c, i) => (
            <div key={i} className="border-b border-gray-100 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">{c.front}</span>
                {c.enrichError ? (
                  <span className="text-xs text-red-500">Failed</span>
                ) : (
                  <span className="text-xs text-green-500">Enriched</span>
                )}
              </div>
              {c.tokConnection && <p className="text-xs text-amber-600 mt-1 truncate">TOK: {c.tokConnection}</p>}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {!saved ? (
            <>
              <button
                onClick={downloadJSON}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium"
              >
                Download JSON
              </button>
              <button
                onClick={saveToSupabase}
                disabled={saving}
                className="flex-1 py-3 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save to Recall"}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => { setStep("upload"); setRawCards([]); setEnrichedCards([]); }}
                className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-medium"
              >
                Import Another Deck
              </button>
              <button
                onClick={runCorrectnessCheck}
                className="w-full py-2 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100"
              >
                Verify Correctness with AI (external/Anki decks)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
