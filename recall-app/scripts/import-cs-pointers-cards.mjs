// Imports a "CS - Pointers & References" deck for Hien (admin) to refresh CS
// fundamentals with an interview slant: C pointers, C++ pointers/references &
// smart pointers, and language-agnostic memory concepts. Mixed depth. Follows the
// app card rules (atomic, retrieval prompts, answer-type variety incl.
// explain-back for open interview questions). Adult/professional enrichment
// prompt (NOT the teen one). Also adds 'computer science' to Hien's profile
// subjects and stars the deck for him. Enrichment via Anthropic directly
// (dev-server outbound is sandbox-blocked). Run from recall-app/:
//   node scripts/import-cs-pointers-cards.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const HIEN = 'be2522d5-b953-4fa3-9920-6cb787c14ca7';
const SUBJECT = 'computer science';
const DECK_NAME = 'CS - Pointers & References';

// For MC, `back` must EXACTLY match one of `choices`.
const CARDS = [
  // ---------- C pointers ----------
  { topic: 'c_pointers', answerType: 'type', front: "What does a pointer variable actually store?", back: 'A memory address', explanation: "A pointer holds the address of another object in memory — not the value itself. You follow (dereference) the address to reach the value." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "In C, what does the unary & operator do?", back: 'Takes the address of a variable (address-of)', choices: ['Takes the address of a variable (address-of)', 'Dereferences a pointer', 'Only bitwise-ANDs two integers', 'Allocates heap memory'], explanation: "&x yields a pointer to x. (In C++ it also appears in type declarations for references, but as a unary operator on a value it means address-of.)" },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "Given a pointer p, what does the unary * operator do?", back: 'Dereferences p — accesses the value at that address', choices: ['Dereferences p — accesses the value at that address', 'Returns the address of p', 'Multiplies p by its size', 'Frees the memory p points to'], explanation: "*p reads/writes the pointee. &  and * are inverses: *(&x) is x." },
  { topic: 'c_pointers', answerType: 'type', front: "A pointer that holds address 0 / points to no valid object is called a ___ pointer.", back: 'null', explanation: "A null pointer (NULL in C, nullptr in C++) points to nothing. Dereferencing it is undefined behavior." },
  { topic: 'c_pointers', answerType: 'type', front: "A pointer that still refers to memory that has been freed or has gone out of scope is called a ___ pointer.", back: 'dangling', explanation: "Dangling pointers are a top source of bugs: the memory may be reused, so dereferencing is undefined behavior. Set pointers to NULL after free to make misuse obvious." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "What happens when you dereference a NULL or dangling pointer in C/C++?", back: 'Undefined behavior (commonly a segfault, but not guaranteed)', choices: ['Undefined behavior (commonly a segfault, but not guaranteed)', 'Always a clean, catchable exception', 'It returns 0 safely', 'The compiler rejects it'], explanation: "The standard says UB — a crash is the lucky case; silent corruption is the dangerous one. Guard with null checks / smart pointers / references." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "For `int *p`, incrementing `p + 1` advances the address by how much?", back: 'sizeof(int) bytes', choices: ['sizeof(int) bytes', '1 byte always', '1 bit', '4 bits'], explanation: "Pointer arithmetic is scaled by the size of the pointee type — that's why p+1 lands on the next int, not the next byte." },
  { topic: 'c_pointers', answerType: 'true-false', front: "True or False: for an array `a`, the expression `a[i]` is defined as `*(a + i)`.", back: 'True', choices: ['True', 'False'], explanation: "Subscripting is pointer arithmetic plus a dereference. A consequence: `a[i]` == `i[a]`. Array names decay to a pointer to the first element in most expressions." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "What is a double pointer (`int **pp`) most commonly used for?", back: 'To modify a pointer itself inside a callee (or to build jagged/2D arrays)', choices: ['To modify a pointer itself inside a callee (or to build jagged/2D arrays)', 'To store two values at once', 'To double a pointer’s address', 'To make a pointer const'], explanation: "C is pass-by-value, so to let a function change the caller's pointer (e.g. allocate and return via out-param) you pass the pointer's address: a pointer to a pointer." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "In C, `const int *p` means:", back: 'p points to a const int — you can’t change *p, but you can repoint p', choices: ['p points to a const int — you can’t change *p, but you can repoint p', 'p is a const pointer — you can’t repoint p, but you can change *p', 'both p and *p are const', 'neither is const'], explanation: "Read right-to-left: 'p is a pointer to const int.' Trick: const left of * → the pointee is const; const right of * → the pointer is const." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "In C, `int * const p` means:", back: 'p is a const pointer — you can’t repoint p, but you can change *p', choices: ['p is a const pointer — you can’t repoint p, but you can change *p', 'p points to a const int', 'both p and *p are const', 'p is a reference'], explanation: "const is right of the *, so the pointer itself is const (must be initialized, can't be reassigned); the pointee is still mutable." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "What is a `void *`?", back: 'A generic pointer with no pointee type; must be cast before dereferencing', choices: ['A generic pointer with no pointee type; must be cast before dereferencing', 'A pointer to a function returning void', 'A null pointer', 'A pointer you cannot assign'], explanation: "void* holds any object address (used by malloc, qsort, etc.). You can't dereference or do arithmetic on it until you cast it to a concrete type." },
  { topic: 'c_pointers', answerType: 'multiple-choice', front: "Calling `free()` twice on the same (non-null) pointer causes:", back: 'Undefined behavior (double free)', choices: ['Undefined behavior (double free)', 'A guaranteed, catchable error', 'Nothing — free is idempotent', 'A compile error'], explanation: "Double free corrupts the allocator and is a classic exploit vector. Setting the pointer to NULL after free helps (free(NULL) is a safe no-op)." },

  // ---------- C++ references & smart pointers ----------
  { topic: 'cpp_references', answerType: 'multiple-choice', front: "How does a C++ reference differ from a pointer? (most complete)", back: 'A reference is an alias: must be initialized, can’t be null, can’t be reseated', choices: ['A reference is an alias: must be initialized, can’t be null, can’t be reseated', 'A reference can be null but a pointer cannot', 'They are identical under the hood with no rules', 'A reference uses more memory than a pointer'], explanation: "A reference is another name for an existing object. No null, no rebinding, no separate address syntax — safer when you always have a valid target." },
  { topic: 'cpp_references', answerType: 'true-false', front: "True or False: a C++ reference can be reseated to refer to a different object after it is initialized.", back: 'False', choices: ['True', 'False'], explanation: "A reference binds once at initialization and can never be made to refer to something else. Assigning through it modifies the referent's value, not the binding." },
  { topic: 'cpp_references', answerType: 'multiple-choice', front: "Why pass a large object as `const T&` instead of by value?", back: 'It avoids copying the object while guaranteeing the function won’t modify it', choices: ['It avoids copying the object while guaranteeing the function won’t modify it', 'It makes a defensive copy automatically', 'It allows the function to reseat the reference', 'It forces heap allocation'], explanation: "const& gives read-only access with no copy — the default for non-trivial parameters. Use by-value only for cheap types or when you need your own copy." },
  { topic: 'cpp_references', answerType: 'explain-back', front: "Interview: when would you choose a pointer over a reference for a function parameter?", back: 'When the argument is optional (can be null) or when you need to reseat it / point to different objects over time. References must always bind to a valid object and can’t be rebound.', explanation: "Rule of thumb: reference when it's always present and fixed; pointer (or std::optional) when it can be absent or needs to change." },
  { topic: 'cpp_references', answerType: 'multiple-choice', front: "`std::unique_ptr` models what ownership?", back: 'Exclusive ownership — move-only, non-copyable', choices: ['Exclusive ownership — move-only, non-copyable', 'Shared ownership via reference counting', 'No ownership (just observes)', 'Garbage-collected ownership'], explanation: "unique_ptr is a zero-overhead sole owner; transfer with std::move. It frees automatically when it goes out of scope (RAII)." },
  { topic: 'smart_pointers', answerType: 'multiple-choice', front: "`std::shared_ptr` manages lifetime using:", back: 'Reference counting — the object is destroyed when the count reaches 0', choices: ['Reference counting — the object is destroyed when the count reaches 0', 'A tracing garbage collector', 'A fixed timer', 'Manual delete only'], explanation: "Each copy bumps a control-block refcount; the last one out frees the object. Thread-safe refcount, but the pointee itself still needs its own synchronization." },
  { topic: 'smart_pointers', answerType: 'multiple-choice', front: "Two objects hold `shared_ptr`s to each other and never free. What breaks the cycle?", back: 'Make one link a `weak_ptr`', choices: ['Make one link a `weak_ptr`', 'Switch both to `unique_ptr`', 'Call delete manually on one', 'Nothing — shared_ptr can’t leak'], explanation: "Reference-counting can't reclaim cycles. weak_ptr observes without bumping the count, so the cycle can be destroyed; lock() it to get a temporary shared_ptr." },
  { topic: 'smart_pointers', answerType: 'type', front: "The C++ idiom that ties a resource's lifetime to an object's scope (acquire in constructor, release in destructor) is called ___.", back: 'RAII', explanation: "RAII (Resource Acquisition Is Initialization) is why smart pointers, lock_guard, and file wrappers free deterministically when scope exits — even on exceptions." },
  { topic: 'cpp_references', answerType: 'multiple-choice', front: "Returning a reference (or pointer) to a local stack variable results in:", back: 'A dangling reference — undefined behavior', choices: ['A dangling reference — undefined behavior', 'A safe copy of the value', 'A compile error always', 'A heap allocation'], explanation: "The local is destroyed when the function returns, so the returned reference points at dead memory. Return by value, or reference something with a longer lifetime." },
  { topic: 'cpp_references', answerType: 'multiple-choice', front: "Prefer `nullptr` over `NULL` in C++ because:", back: 'nullptr has a real pointer type (std::nullptr_t), so it’s type-safe in overloads/templates', choices: ['nullptr has a real pointer type (std::nullptr_t), so it’s type-safe in overloads/templates', 'nullptr is faster at runtime', 'NULL was removed from C++', 'They are exactly the same'], explanation: "NULL is often just 0 (an int), which picks the wrong overload (f(int) vs f(char*)) and breaks template deduction. nullptr fixes that." },
  { topic: 'smart_pointers', answerType: 'explain-back', front: "Interview: explain the difference between unique_ptr and shared_ptr.", back: 'unique_ptr is the sole owner — move-only, no refcount, zero overhead, frees when it leaves scope. shared_ptr allows multiple owners via a reference count and frees when the last owner is gone (watch for cycles — use weak_ptr).', explanation: "Default to unique_ptr; reach for shared_ptr only when ownership is genuinely shared, because of the refcount cost and cycle risk." },

  // ---------- Language-agnostic memory concepts ----------
  { topic: 'memory_concepts', answerType: 'multiple-choice', front: "Local variables with automatic storage duration live on the:", back: 'stack', choices: ['stack', 'heap', 'static/data segment', 'CPU registers only'], explanation: "The stack grows/shrinks with function calls; locals are freed automatically on return. Fast (just moves the stack pointer) but limited in size." },
  { topic: 'memory_concepts', answerType: 'multiple-choice', front: "Memory from malloc/new (dynamic allocation) lives on the:", back: 'heap', choices: ['heap', 'stack', 'instruction cache', 'read-only segment'], explanation: "Heap memory outlives the current scope and must be released (free/delete or a smart pointer). More flexible, but slower and the source of leaks." },
  { topic: 'memory_concepts', answerType: 'true-false', front: "True or False: stack allocation is generally faster than heap allocation.", back: 'True', choices: ['True', 'False'], explanation: "Stack 'allocation' is just adjusting the stack pointer; heap allocation walks free lists / may call the OS. Prefer the stack (and RAII) when lifetime allows." },
  { topic: 'memory_concepts', answerType: 'type', front: "Two different names or pointers that refer to the same memory location are said to be ___.", back: 'aliasing', explanation: "Aliasing enables sharing but complicates reasoning and optimization (the compiler can't assume writes through one name don't affect the other — see 'restrict' / strict-aliasing)." },
  { topic: 'memory_concepts', answerType: 'multiple-choice', front: "Under value semantics, assigning or passing an object:", back: 'copies it — the two now have independent state', choices: ['copies it — the two now have independent state', 'shares it — both names see the same object', 'moves it, leaving the source empty', 'is a compile error'], explanation: "Value semantics = copies (independent). Reference semantics = both names alias one object, so a change through one is visible through the other." },
  { topic: 'memory_concepts', answerType: 'multiple-choice', front: "A shallow copy of an object copies:", back: 'the top-level fields, including pointers — so both share the pointed-to data', choices: ['the top-level fields, including pointers — so both share the pointed-to data', 'everything recursively, duplicating pointed-to data', 'only the first field', 'nothing (it aliases)'], explanation: "Shallow copy duplicates the handle but shares the underlying buffer → double-free / aliasing bugs. A deep copy clones the underlying data too." },
  { topic: 'interview', answerType: 'explain-back', front: "Interview: what is the difference between a pointer and a reference?", back: 'A pointer is a variable holding an address: it can be null, reassigned, and does arithmetic. A reference is an alias to an existing object: it must be initialized, can’t be null, and can’t be reseated. Use a reference when a valid target always exists; a pointer when it can be absent or must change.', explanation: "The classic opener. Hit: nullability, rebinding, initialization, and arithmetic — then say when you'd pick each." },
  { topic: 'interview', answerType: 'explain-back', front: "Interview: what is a memory leak and how do you prevent it in C++?", back: 'A leak is heap memory that’s allocated but never freed, so it stays reserved for the process lifetime. Prevent it with RAII — smart pointers (unique_ptr/shared_ptr), containers, and lock/file wrappers — so release is automatic even on exceptions. Avoid raw new/delete.', explanation: "Interviewers want 'RAII / smart pointers,' plus awareness that exceptions make manual delete fragile." },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function enrichPrompt(card) {
  return `You are enriching flashcards for an experienced software engineer refreshing computer-science fundamentals (pointers, references, memory). Audience: a professional adult, interview-prep context. Keep it precise, technical, and concise — no childish analogies.

Flashcard:
- Front: ${card.front}
- Back: ${card.back}

Return ONLY valid JSON (no markdown) with these fields, each 1-2 sentences:
{
  "realWorldConnection": "A concrete engineering scenario where this matters (a bug you'd hit, a code-review catch, systems/perf context).",
  "interdisciplinary": "Link to another CS area — OS memory management, computer architecture, compilers/optimization, or how another language (e.g. Rust's borrow checker, Java/Go references, GC) handles the same idea.",
  "tokConnection": "A deeper 'why is it defined this way / how do we know it's correct' prompt (e.g. what the language standard guarantees vs leaves undefined).",
  "inquiryQuestion": "An open design-tradeoff question worth debating (no single right answer)."
}`;
}

async function enrichCard(card) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: enrichPrompt(card) }] }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      let text = data.content[0]?.text || '{}';
      text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const e = JSON.parse(text);
      return {
        real_world_connection: e.realWorldConnection || null,
        tok_connection: e.tokConnection || null,
        interdisciplinary: e.interdisciplinary || null,
        inquiry_question: e.inquiryQuestion || null,
      };
    } catch (err) { lastErr = err; await sleep(1500 * attempt); }
  }
  throw lastErr;
}

async function main() {
  const { data: existing } = await sb.from('cards').select('front, decks!inner(subject)').eq('decks.subject', SUBJECT);
  const existingFronts = new Set((existing || []).map((c) => c.front.toLowerCase().trim()));
  const fresh = CARDS.filter((c) => !existingFronts.has(c.front.toLowerCase().trim()));
  console.log(`Cards to import: ${fresh.length} (skipped ${CARDS.length - fresh.length} duplicates)`);
  if (fresh.length === 0) return;

  let deckId;
  const { data: existingDeck } = await sb.from('decks').select('id').eq('name', DECK_NAME).eq('subject', SUBJECT).maybeSingle();
  if (existingDeck) { deckId = existingDeck.id; console.log(`Reusing deck ${DECK_NAME} (${deckId})`); }
  else {
    const { data: deck, error } = await sb.from('decks').insert({ name: DECK_NAME, subject: SUBJECT, created_by: HIEN }).select().single();
    if (error) throw error; deckId = deck.id; console.log(`Created deck ${DECK_NAME} (${deckId})`);
  }

  const enriched = new Map();
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = fresh.slice(i, i + 3);
    process.stdout.write(`Enriching ${i + 1}-${i + batch.length}/${fresh.length}... `);
    const results = await Promise.allSettled(batch.map((c) => enrichCard(c)));
    results.forEach((r, j) => { if (r.status === 'fulfilled') enriched.set(batch[j].front, r.value); else console.log(`\n  (enrich failed "${batch[j].front.slice(0,30)}...": ${r.reason?.message || r.reason})`); });
    console.log('done'); await sleep(300);
  }

  const rows = fresh.map((c) => {
    const enr = enriched.get(c.front) || {};
    return { deck_id: deckId, front: c.front, back: c.back, answer_type: c.answerType, choices: c.choices || null, topic: c.topic,
      explanation: c.explanation, real_world_connection: enr.real_world_connection || null, tok_connection: enr.tok_connection || null,
      interdisciplinary: enr.interdisciplinary || null, inquiry_question: enr.inquiry_question || null, audio_lang: 'en-US' };
  });
  const { error: insErr } = await sb.from('cards').insert(rows);
  if (insErr) throw insErr;

  // Add 'computer science' to Hien's subjects so it surfaces in Progress/sessions
  const { data: prof } = await sb.from('profiles').select('subjects').eq('id', HIEN).single();
  const subs = new Set(prof?.subjects || []); subs.add(SUBJECT);
  await sb.from('profiles').update({ subjects: [...subs] }).eq('id', HIEN);
  // Star the deck for Hien
  await sb.from('deck_priorities').upsert({ user_id: HIEN, deck_id: deckId, starred: true }, { onConflict: 'user_id,deck_id' });

  const byType = rows.reduce((m, r) => ((m[r.answer_type] = (m[r.answer_type] || 0) + 1), m), {});
  const byTopic = rows.reduce((m, r) => ((m[r.topic] = (m[r.topic] || 0) + 1), m), {});
  console.log(`\nInserted ${rows.length} cards (${JSON.stringify(byType)}).`);
  console.log(`Topics: ${JSON.stringify(byTopic)}`);
  console.log(`Added subject '${SUBJECT}' to Hien's profile and starred the deck.`);
}

main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
