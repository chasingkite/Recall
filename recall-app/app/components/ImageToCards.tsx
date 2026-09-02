"use client";

import { useState, useRef } from "react";
import { createClient } from "../lib/supabase/client";

const SUBJECTS = ["spanish", "biology", "english", "math", "pe"];

interface GeneratedCard {
  front: string;
  back: string;
  choices: string | null;
}

export default function ImageToCards() {
  const [step, setStep] = useState<"upload" | "processing" | "preview" | "saving" | "done">("upload");
  const [subject, setSubject] = useState("");
  const [deckName, setDeckName] = useState("");
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");

    // Preview the image
    if (file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".heic")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else if (file.name.toLowerCase().endsWith(".pdf")) {
      setPreview(null); // Can't preview PDFs inline
    }

    setStep("processing");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("subject", subject);

    try {
      const res = await fetch("/api/image-to-cards", { method: "POST", body: formData });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setStep("upload");
        return;
      }

      setCards(data.cards || []);
      setStep("preview");
    } catch (err) {
      setError("Failed to process image: " + err);
      setStep("upload");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const [savingStep, setSavingStep] = useState("");

  async function saveToSupabase() {
    setStep("saving");
    setSavingStep("Enriching cards with TOK & real-world connections...");
    const supabase = createClient();

    // Step 1: Enrich cards with TOK/interdisciplinary
    let enrichedCards = cards;
    try {
      const enrichRes = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: cards.map((c) => ({ front: c.front, back: c.back, subject })) }),
      });
      const enrichData = await enrichRes.json();
      if (enrichData.cards) {
        enrichedCards = enrichData.cards.map((ec: any, i: number) => ({
          ...cards[i],
          explanation: ec.explanation || null,
          realWorldConnection: ec.realWorldConnection || null,
          tokConnection: ec.tokConnection || null,
          interdisciplinary: ec.interdisciplinary || null,
          inquiryQuestion: ec.inquiryQuestion || null,
        }));
      }
    } catch {}

    // Step 2: Create deck
    setSavingStep("Creating deck...");
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({ name: deckName || "Image Import", subject, shared: true })
      .select()
      .single();

    if (deckError || !deck) {
      setError("Failed to create deck: " + (deckError?.message || ""));
      setStep("preview");
      return;
    }

    // Step 3: Dedup
    setSavingStep("Checking for duplicates...");
    const { data: existing } = await supabase
      .from("cards")
      .select("front, decks!inner(subject)")
      .eq("decks.subject", subject);
    const existingFronts = new Set((existing || []).map((c: any) => c.front.toLowerCase().trim()));

    const newCards = enrichedCards
      .filter((c: any) => !existingFronts.has(c.front.toLowerCase().trim()))
      .map((c: any) => ({
        deck_id: deck.id,
        front: c.front,
        back: c.back,
        answer_type: c.choices ? "multiple-choice" : "type",
        choices: c.choices ? c.choices.split("|").map((ch: string) => ch.trim()) : null,
        topic: deckName?.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "_").slice(0, 40) || null,
        explanation: c.explanation || null,
        real_world_connection: c.realWorldConnection || null,
        tok_connection: c.tokConnection || null,
        interdisciplinary: c.interdisciplinary || null,
        inquiry_question: c.inquiryQuestion || null,
      }));

    if (newCards.length === 0) {
      setError("All cards already exist. Nothing to import.");
      setStep("preview");
      return;
    }

    // Step 4: Save
    // Step 4: Save
    setSavingStep(`Saving ${newCards.length} cards to database...`);
    const { error: insertError } = await supabase.from("cards").insert(newCards);
    if (insertError) {
      setError("Failed to save: " + insertError.message);
      setStep("preview");
      return;
    }

    setSavedCount(newCards.length);
    setStep("done");
  }

  if (step === "upload") {
    return (
      <div className="w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Create Cards from Image</h2>
        <p className="text-sm text-gray-500 mb-4">Upload a photo of a worksheet, textbook page, or quiz. AI will extract flashcards.</p>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 block mb-1">Deck Name</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g. PE Chapter 3 Quiz"
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

        <label
          className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <span className="text-3xl block mb-2">📸</span>
          <span className="text-sm text-gray-600 block">Tap to upload or drop image here</span>
          <span className="text-xs text-gray-400 block mt-1">Supports: JPG, PNG, HEIC, PDF</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.heic,.heif"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="hidden"
          />
        </label>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="w-full flex flex-col items-center py-12">
        {preview && <img src={preview} alt="" className="w-full max-w-xs rounded-lg mb-4 opacity-50" />}
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm font-medium text-gray-900">Reading image and creating cards...</p>
        <p className="text-xs text-gray-500 mt-1">This may take 10-15 seconds</p>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{cards.length} Cards Found</h2>
        <p className="text-xs text-gray-500 mb-4">Review the cards below. Edit or remove any that don&apos;t look right.</p>

        {preview && <img src={preview} alt="" className="w-full max-w-xs rounded-lg mb-4 mx-auto" />}

        <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
          {cards.map((c, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.front}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{c.back}</p>
                  {c.choices && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.choices.split("|").map((ch, j) => (
                        <span key={j} className={`text-xs px-1.5 py-0.5 rounded ${ch.trim() === c.back ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {ch.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCards(cards.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setStep("upload"); setCards([]); setPreview(null); }}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium"
          >
            Back
          </button>
          <button
            onClick={saveToSupabase}
            disabled={!subject}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {!subject ? "Select a subject first" : `Save ${cards.length} Cards`}
          </button>
        </div>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    );
  }

  if (step === "saving") {
    return (
      <div className="w-full flex flex-col items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm font-medium text-gray-900">{savingStep}</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="w-full text-center py-12">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{savedCount} Cards Saved!</h2>
        <p className="text-sm text-gray-500 mb-6">Ready for studying</p>
        <button
          onClick={() => { setStep("upload"); setCards([]); setPreview(null); setSavedCount(0); }}
          className="w-full max-w-xs py-3 rounded-xl bg-blue-600 text-white text-sm font-medium mx-auto"
        >
          Upload Another Image
        </button>
      </div>
    );
  }

  return null;
}
