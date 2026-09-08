# Test Mode + Study Steering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give students a per-session Focus picker (subject + topic) and a Test Mode (more than 5 cards), and give admins a persistent per-student deck-starring control — so sessions can be steered without the temporary profile hack.

**Architecture:** Extract the new selection logic into a pure, unit-testable module (`app/lib/session-builder.ts`) that the `smart-session` API route calls. Add a `deck_priorities` table (per-student boolean star) surfaced through a small API route and an AdminDashboard control. Extend the Study start screen with Focus + size controls that pass new query params to `smart-session`.

**Tech Stack:** Next.js 16 API routes, React 19 client components, Supabase (Postgres + RLS), TypeScript. Unit tests via `node --experimental-strip-types test-unit.ts`; integration via `node test-integration.mjs` (needs dev server on :3001).

**Spec:** `docs/superpowers/specs/2026-09-08-test-mode-study-steering-design.md`

---

## File Structure

- **Create** `app/lib/session-builder.ts` — pure helpers: `getSessionSize`, `selectFocusCards`, `orderByStarred`. One responsibility: turn inputs into a card ordering/size, no I/O.
- **Create** `app/api/deck-priorities/route.ts` — GET (list starred deck ids for a user) + POST (star/unstar). Service-role, mirrors `app/api/points/` style.
- **Modify** `app/api/smart-session/route.ts` — accept `topic` param, add `deck_id` to the card select, use the pure helpers for size/focus/star ordering, skip subject-diversity reservation when a focus is active.
- **Modify** `app/components/StudyTab.tsx` — start screen: Focus (subject + topic) selectors and a size choice (Quick / Full / Test); pass `mode`/`subject`/`topic` to `smart-session`.
- **Modify** `app/components/AdminDashboard.tsx` — per-student deck list with a ⭐ toggle calling the new route.
- **Modify** `supabase-migration.sql` — `deck_priorities` table + indexes + RLS.
- **Modify** `test-unit.ts` — add `testSessionBuilder()`.
- **Modify** `test-integration.mjs` — add smart-session focus/mode + deck-priorities tests.

---

## Task 1: `deck_priorities` migration

**Files:**
- Modify: `supabase-migration.sql` (append)

- [ ] **Step 1: Append the table + RLS to the migration file**

```sql
-- ============ deck_priorities: per-student starred decks ============
create table if not exists deck_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  deck_id uuid not null references decks(id) on delete cascade,
  starred boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, deck_id)
);
create index if not exists idx_deck_priorities_user on deck_priorities(user_id);

alter table deck_priorities enable row level security;

-- Admins manage all rows
create policy "deck_priorities_admin_all" on deck_priorities
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- A student may read their own rows
create policy "deck_priorities_read_own" on deck_priorities
  for select using (user_id = auth.uid());
```

- [ ] **Step 2: Run it in the Supabase SQL Editor**

Paste the appended block into Supabase → SQL Editor → Run. Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the table exists**

Run in SQL Editor: `select count(*) from deck_priorities;`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add supabase-migration.sql
git commit -m "feat: add deck_priorities table for per-student deck starring"
```

---

## Task 2: `getSessionSize` (pure helper + unit test)

**Files:**
- Create: `app/lib/session-builder.ts`
- Test: `test-unit.ts`

- [ ] **Step 1: Write the failing test** — add to `test-unit.ts` (import at top, and call `testSessionBuilder()` near the other test calls at the bottom of the file)

```ts
// add to the import block near the top:
import {
  getSessionSize,
  selectFocusCards,
  orderByStarred,
  type BuilderCard,
} from "./app/lib/session-builder.ts";

// add this function alongside the other test functions:
function testSessionBuilder() {
  console.log("\n🎯 Session Builder");

  // getSessionSize
  assert(getSessionSize("quick5", false) === 5, "quick5 = 5 cards");
  assert(getSessionSize("full", false) === 20, "full = 20 cards");
  assert(getSessionSize("test", true) === 40, "test + focus = 40 cards");
  assert(getSessionSize("test", false) === 30, "test no focus = 30 cards");
  assert(getSessionSize("anything-else", false) === 20, "unknown mode defaults to 20");
}
```

Also add `testSessionBuilder();` next to the other invocations at the end of the file.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types test-unit.ts`
Expected: FAIL — `Cannot find module './app/lib/session-builder.ts'`.

- [ ] **Step 3: Write minimal implementation** — create `app/lib/session-builder.ts`

```ts
export type SessionMode = "quick5" | "full" | "test";

/** Minimal card shape the builder needs. */
export interface BuilderCard {
  id: string;
  topic: string | null;
  deck_id: string;
  decks: { subject: string } | null;
}

/**
 * Session size by mode. Test Mode returns a larger set — 40 when a topic
 * focus is active (a deep single-topic drill), 30 when unfocused.
 */
export function getSessionSize(mode: string, hasFocus: boolean): number {
  if (mode === "quick5") return 5;
  if (mode === "test") return hasFocus ? 40 : 30;
  return 20; // "full" and any unknown mode
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types test-unit.ts`
Expected: PASS (the 5 new assertions show ✅).

- [ ] **Step 5: Commit**

```bash
git add app/lib/session-builder.ts test-unit.ts
git commit -m "feat: add getSessionSize session-builder helper"
```

---

## Task 3: `selectFocusCards` (pure helper + unit test)

**Files:**
- Modify: `app/lib/session-builder.ts`
- Test: `test-unit.ts`

- [ ] **Step 1: Write the failing test** — add inside `testSessionBuilder()`

```ts
  const cards: BuilderCard[] = [
    { id: "a", topic: "dilation_basics", deck_id: "d1", decks: { subject: "math" } },
    { id: "b", topic: "psat_factoring", deck_id: "d2", decks: { subject: "math" } },
    { id: "c", topic: "greetings", deck_id: "d3", decks: { subject: "spanish" } },
  ];
  // subject-only focus
  const mathOnly = selectFocusCards(cards, { subject: "math", topic: null });
  assert(mathOnly.length === 2, "focus subject=math keeps 2 math cards");
  assert(mathOnly.every((c) => c.decks?.subject === "math"), "no non-math cards leak in");
  // subject + topic focus
  const dilationOnly = selectFocusCards(cards, { subject: "math", topic: "dilation_basics" });
  assert(dilationOnly.length === 1 && dilationOnly[0].id === "a", "focus topic keeps only that topic");
  // no focus
  assert(selectFocusCards(cards, { subject: null, topic: null }).length === 3, "no focus keeps all");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types test-unit.ts`
Expected: FAIL — `selectFocusCards is not a function`.

- [ ] **Step 3: Write minimal implementation** — append to `app/lib/session-builder.ts`

```ts
/** Keep only cards matching the given subject and/or topic. Null filters are ignored. */
export function selectFocusCards<T extends BuilderCard>(
  cards: T[],
  focus: { subject?: string | null; topic?: string | null }
): T[] {
  return cards.filter((c) => {
    if (focus.subject && c.decks?.subject !== focus.subject) return false;
    if (focus.topic && c.topic !== focus.topic) return false;
    return true;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types test-unit.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/session-builder.ts test-unit.ts
git commit -m "feat: add selectFocusCards session-builder helper"
```

---

## Task 4: `orderByStarred` (pure helper + unit test)

**Files:**
- Modify: `app/lib/session-builder.ts`
- Test: `test-unit.ts`

- [ ] **Step 1: Write the failing test** — add inside `testSessionBuilder()`

```ts
  const pool: BuilderCard[] = [
    { id: "x", topic: "t", deck_id: "plain", decks: { subject: "math" } },
    { id: "y", topic: "t", deck_id: "starred", decks: { subject: "math" } },
    { id: "z", topic: "t", deck_id: "plain", decks: { subject: "math" } },
  ];
  const ordered = orderByStarred(pool, new Set(["starred"]));
  assert(ordered[0].id === "y", "starred-deck card sorts first");
  assert(ordered.length === 3, "orderByStarred keeps all cards");
  assert(orderByStarred(pool, new Set()).map((c) => c.id).join("") === "xyz", "no stars = original order");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types test-unit.ts`
Expected: FAIL — `orderByStarred is not a function`.

- [ ] **Step 3: Write minimal implementation** — append to `app/lib/session-builder.ts`

```ts
/** Stable-partition so cards from starred decks come first; order within each group is preserved. */
export function orderByStarred<T extends BuilderCard>(cards: T[], starredDeckIds: Set<string>): T[] {
  if (starredDeckIds.size === 0) return cards;
  const starred = cards.filter((c) => starredDeckIds.has(c.deck_id));
  const rest = cards.filter((c) => !starredDeckIds.has(c.deck_id));
  return [...starred, ...rest];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types test-unit.ts`
Expected: PASS. Full suite still green.

- [ ] **Step 5: Commit**

```bash
git add app/lib/session-builder.ts test-unit.ts
git commit -m "feat: add orderByStarred session-builder helper"
```

---

## Task 5: Wire helpers into `smart-session` route

**Files:**
- Modify: `app/api/smart-session/route.ts`
- Test: `test-integration.mjs`

Reference points in the current route (verify line numbers before editing — the file is ~304 lines):
- Query params parsed near the top (`userId`, `mode`, `subject`).
- Card query builders (`cardQuery`) select `id, front, back, topic, answer_type, choices, decks!inner(subject)` — **must add `deck_id`**.
- `sessionSize` computed as `mode === "quick5" ? 5 : 20`.
- Subject-diversity reservation block builds `subjectSlots` and fills reserved slots.

- [ ] **Step 1: Add the integration test first** — add to `test-integration.mjs` (follow the file's existing `test(name, fn)` / `api(path)` helpers)

```js
// Focus filtering: topic-restricted session returns only that topic
await test("smart-session topic focus returns only that topic", async () => {
  const r = await api(`/api/smart-session?userId=${TEST_USER_ID}&mode=full&subject=math&topic=dilation_basics`);
  const data = await r.json();
  const bad = (data.cards || []).filter((c) => c.topic && c.topic !== "dilation_basics");
  assert(bad.length === 0, `expected only dilation_basics, got ${bad.map((c) => c.topic).join(",")}`);
});

// Test Mode returns more than 5
await test("smart-session test mode returns >5 cards when enough exist", async () => {
  const r = await api(`/api/smart-session?userId=${TEST_USER_ID}&mode=test&subject=all`);
  const data = await r.json();
  assert((data.cards || []).length > 5 || data.totalDue <= 5, "test mode should exceed 5 when cards available");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run (dev server must be on :3001): `node test-integration.mjs`
Expected: the two new tests FAIL (topic param ignored; size still 20/5).

- [ ] **Step 3: Import the helpers and add `deck_id` to the selects**

At the top of `app/api/smart-session/route.ts` (relative import, matching the convention used by other routes like `card-review`):

```ts
import { getSessionSize, selectFocusCards, orderByStarred } from "../../lib/session-builder";
```

In every `cardQuery` select string, change `"id, front, back, topic, answer_type, choices, decks!inner(subject)"` to include `deck_id`:

```ts
"id, front, back, topic, answer_type, choices, deck_id, decks!inner(subject)"
```

(and the non-inner variant likewise: `"id, front, back, topic, answer_type, choices, deck_id, decks(subject)"`).

- [ ] **Step 4: Parse `topic`, compute focus + size, load stars**

Right after `const subject = searchParams.get("subject") || "all";` add:

```ts
const topic = searchParams.get("topic") || "";
const hasFocus = !!topic;
```

Replace `const sessionSize = mode === "quick5" ? 5 : 20;` with:

```ts
const sessionSize = getSessionSize(mode, hasFocus);
```

After `reviewMap` is built (where `userId` is known), load starred decks:

```ts
const { data: starRows } = userId
  ? await supabase.from("deck_priorities").select("deck_id").eq("user_id", userId).eq("starred", true)
  : { data: null };
const starredDeckIds = new Set<string>((starRows || []).map((r: any) => r.deck_id));
```

- [ ] **Step 5: Branch: focused session skips subject diversity**

Immediately after the `dueCards`/`unseenCards`/`notDueCards` partition loop, insert a focus short-circuit that builds the session directly and returns:

```ts
if (hasFocus) {
  const focusSubject = subject !== "all" ? subject : null;
  const pool = orderByStarred(
    [
      ...selectFocusCards(dueCards as any, { subject: focusSubject, topic }),
      ...selectFocusCards(unseenCards as any, { subject: focusSubject, topic }),
      ...selectFocusCards(notDueCards as any, { subject: focusSubject, topic }),
    ],
    starredDeckIds
  );
  const sessionCards = pool.slice(0, sessionSize);
  return NextResponse.json({
    cards: sessionCards,
    allCards: cards.slice(0, 100),
    assignments: upcomingAssignments.map((a) => ({ name: a.name, dueAt: a.dueAt })),
    matchedTopics,
    dueCount: dueCards.length,
    unseenCount: unseenCards.length,
    totalDue: pool.length,
  });
}
```

(Place this before the existing "Build session — guarantee subject diversity" block so the diversity path only runs for unfocused sessions.)

- [ ] **Step 6: Apply star ordering in the unfocused path**

In the reserved-slot fill, where `subjectPool` is built and sorted, replace the trailing `.sort(() => Math.random() - 0.5)` result usage so starred cards lead:

```ts
const subjectPool = orderByStarred(
  allAvailable.filter((c: any) => c.decks?.subject === subj && !usedIds.has(c.id)).sort(() => Math.random() - 0.5),
  starredDeckIds
);
```

- [ ] **Step 7: Run integration tests to verify they pass**

Run: `node test-integration.mjs`
Expected: the two new tests PASS; existing tests still PASS.

- [ ] **Step 8: Type check + commit**

```bash
node_modules/.bin/tsc --noEmit
git add app/api/smart-session/route.ts test-integration.mjs
git commit -m "feat: smart-session topic focus, Test Mode sizing, star ordering"
```

---

## Task 6: `deck-priorities` API route

**Files:**
- Create: `app/api/deck-priorities/route.ts`
- Test: `test-integration.mjs`

- [ ] **Step 1: Write the integration test first**

```js
await test("deck-priorities POST stars then GET lists it", async () => {
  // pick any deck id
  const dRes = await fetch(`${SB_URL}/rest/v1/decks?select=id&limit=1`, { headers: SB_HEADERS });
  const deckId = (await dRes.json())[0].id;
  const post = await api(`/api/deck-priorities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, deckId, starred: true }),
  });
  assert(post.ok, "POST star ok");
  const get = await api(`/api/deck-priorities?userId=${TEST_USER_ID}`);
  const ids = (await get.json()).starredDeckIds || [];
  assert(ids.includes(deckId), "GET returns the starred deck id");
  // unstar (cleanup)
  await api(`/api/deck-priorities`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, deckId, starred: false }),
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node test-integration.mjs`
Expected: FAIL — 404 on `/api/deck-priorities`.

- [ ] **Step 3: Implement the route** — create `app/api/deck-priorities/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const { data, error } = await admin()
    .from("deck_priorities")
    .select("deck_id")
    .eq("user_id", userId)
    .eq("starred", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ starredDeckIds: (data || []).map((r) => r.deck_id) });
}

export async function POST(request: Request) {
  const { userId, deckId, starred } = await request.json();
  if (!userId || !deckId) return NextResponse.json({ error: "userId and deckId required" }, { status: 400 });
  const sb = admin();
  if (starred) {
    const { error } = await sb
      .from("deck_priorities")
      .upsert({ user_id: userId, deck_id: deckId, starred: true }, { onConflict: "user_id,deck_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb.from("deck_priorities").delete().eq("user_id", userId).eq("deck_id", deckId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run integration test to verify it passes**

Run: `node test-integration.mjs`
Expected: PASS.

- [ ] **Step 5: Type check + commit**

```bash
node_modules/.bin/tsc --noEmit
git add app/api/deck-priorities/route.ts test-integration.mjs
git commit -m "feat: deck-priorities API (list/star/unstar)"
```

---

## Task 7: Study start screen — Focus picker + size choice

**Files:**
- Modify: `app/components/StudyTab.tsx`

Reference: the session fetch is currently hardcoded at ~line 187 (`?userId=...&mode=quick5&subject=all`). The Start button is at ~line 581.

- [ ] **Step 1: Add state for focus + mode**

Near the other `useState` declarations in StudyTab:

```tsx
const [sessionMode, setSessionMode] = useState<"quick5" | "full" | "test">("quick5");
const [focusSubject, setFocusSubject] = useState<string>("all");
const [focusTopic, setFocusTopic] = useState<string>("");
const [profileSubjects, setProfileSubjects] = useState<string[]>([]);
const [focusTopics, setFocusTopics] = useState<string[]>([]);
```

- [ ] **Step 2: Load the user's subjects on mount**

Add an effect (uses the existing `supabase` client and `user`):

```tsx
useEffect(() => {
  if (!user?.id) return;
  supabase.from("profiles").select("subjects").eq("id", user.id).single()
    .then(({ data }) => setProfileSubjects((data?.subjects as string[]) || []));
}, [user?.id]);
```

- [ ] **Step 3: Load topics when a subject is chosen**

```tsx
useEffect(() => {
  if (focusSubject === "all") { setFocusTopics([]); setFocusTopic(""); return; }
  supabase.from("cards").select("topic, decks!inner(subject)").eq("decks.subject", focusSubject)
    .then(({ data }) => {
      const topics = [...new Set((data || []).map((c: any) => c.topic).filter(Boolean))].sort();
      setFocusTopics(topics);
      setFocusTopic("");
    });
}, [focusSubject]);
```

- [ ] **Step 4: Render the controls above the Start button** (insert before the Start `<button>` at ~line 581)

```tsx
<div className="w-full max-w-sm mb-4 space-y-3">
  <div className="flex gap-2">
    {(["quick5", "full", "test"] as const).map((m) => (
      <button key={m} onClick={() => setSessionMode(m)}
        className={`flex-1 py-2 rounded-[12px] text-[13px] font-semibold transition ${sessionMode === m ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
        {m === "quick5" ? "Quick (5)" : m === "full" ? "Full (20)" : "Test Mode"}
      </button>
    ))}
  </div>
  <select value={focusSubject} onChange={(e) => setFocusSubject(e.target.value)}
    className="w-full py-2 px-3 rounded-[12px] bg-white border border-gray-200 text-[14px]">
    <option value="all">All subjects</option>
    {profileSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
  </select>
  {focusTopics.length > 0 && (
    <select value={focusTopic} onChange={(e) => setFocusTopic(e.target.value)}
      className="w-full py-2 px-3 rounded-[12px] bg-white border border-gray-200 text-[14px]">
      <option value="">All topics in {focusSubject}</option>
      {focusTopics.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  )}
</div>
```

- [ ] **Step 5: Use the chosen values in the fetch** — change the hardcoded fetch (~line 187)

```tsx
const cardsPromise = fetch(
  `/api/smart-session?userId=${user?.id || ""}&mode=${sessionMode}&subject=${encodeURIComponent(focusSubject)}&topic=${encodeURIComponent(focusTopic)}`
).then((r) => r.json());
```

- [ ] **Step 6: Manual verification**

Run: `yarn dev` (or use the running dev server). In the app: Study tab → choose **Math → dilation_basics → Test Mode** → Start. Expected: only dilation_basics cards, more than 5.

- [ ] **Step 7: Type check + commit**

```bash
node_modules/.bin/tsc --noEmit
git add app/components/StudyTab.tsx
git commit -m "feat: Study start screen Focus picker + Test Mode size choice"
```

---

## Task 8: AdminDashboard — deck starring

**Files:**
- Modify: `app/components/AdminDashboard.tsx`

- [ ] **Step 1: Add state + loaders** (inside the component, adapt names to the existing per-student rendering)

```tsx
const [decks, setDecks] = useState<{ id: string; name: string; subject: string }[]>([]);
const [starredByUser, setStarredByUser] = useState<Record<string, Set<string>>>({});

useEffect(() => {
  supabase.from("decks").select("id, name, subject").order("subject")
    .then(({ data }) => setDecks((data as any) || []));
}, []);

async function loadStars(userId: string) {
  const res = await fetch(`/api/deck-priorities?userId=${userId}`);
  const { starredDeckIds } = await res.json();
  setStarredByUser((prev) => ({ ...prev, [userId]: new Set(starredDeckIds || []) }));
}

async function toggleStar(userId: string, deckId: string, starred: boolean) {
  await fetch(`/api/deck-priorities`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, deckId, starred }),
  });
  await loadStars(userId);
}
```

- [ ] **Step 2: Render the toggle list per student** (call `loadStars(student.id)` when expanding a student; render decks grouped by subject)

```tsx
<div className="mt-3">
  <p className="text-[13px] font-semibold text-gray-700 mb-2">Study focus — starred decks get more cards</p>
  {decks.map((d) => {
    const on = starredByUser[student.id]?.has(d.id) ?? false;
    return (
      <button key={d.id} onClick={() => toggleStar(student.id, d.id, !on)}
        className="w-full flex items-center justify-between py-2 px-3 rounded-[10px] active:opacity-50">
        <span className="text-[14px] text-gray-800">{d.name} <span className="text-[11px] text-gray-400">({d.subject})</span></span>
        <span className={`text-[16px] ${on ? "text-yellow-500" : "text-gray-300"}`}>{on ? "★" : "☆"}</span>
      </button>
    );
  })}
</div>
```

- [ ] **Step 3: Manual verification**

Run the app as admin → AdminDashboard → expand a student → star a deck → reload → star persists. Then run a session for that student and confirm starred-deck cards appear earlier/more often.

- [ ] **Step 4: Type check + commit**

```bash
node_modules/.bin/tsc --noEmit
git add app/components/AdminDashboard.tsx
git commit -m "feat: admin deck-starring UI in AdminDashboard"
```

---

## Task 9: Retire the temporary Hailey profile hack

**Files:**
- Run: `recall-app/scripts/revert-hailey-focus.mjs`

- [ ] **Step 1: Confirm the feature works end-to-end** (Tasks 5–8 deployed to production).

- [ ] **Step 2: Revert Hailey to normal + restore deck subjects**

Run: `cd recall-app && node scripts/revert-hailey-focus.mjs`
Expected: prints restored subjects `["spanish","biology","english","math",...]` and the 5 decks back to `math`.

- [ ] **Step 3: Verify in-app** — Hailey now uses the Focus picker (Math → dilation) instead of the profile hack; Connor sees the dilation decks under `math` again.

- [ ] **Step 4: Commit** (only if any docs changed) — otherwise nothing to commit; note completion in the PR description.

---

## Full-suite gate (run before final merge)

```bash
node --experimental-strip-types test-unit.ts   # expect all pass incl. session-builder
node test-integration.mjs                       # expect all pass (dev server on :3001)
node_modules/.bin/tsc --noEmit                  # expect clean
```
