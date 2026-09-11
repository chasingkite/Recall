import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const revert = JSON.parse(readFileSync('scripts/hailey-focus-revert.json', 'utf8'));
  // Restore deck subjects
  for (const d of revert.decks) {
    const { error } = await sb.from('decks').update({ subject: d.subject }).eq('id', d.id);
    if (error) throw error;
  }
  // Restore Hailey subjects
  const { error: pe } = await sb.from('profiles').update({ subjects: revert.hailey_subjects }).eq('id', revert.hailey_id);
  if (pe) throw pe;
  console.log('Reverted. Hailey subjects:', JSON.stringify(revert.hailey_subjects));
  console.log('Decks restored:', revert.decks.map((d) => `${d.name} → ${d.subject}`).join(', '));
}
main().catch((e) => { console.error('FAILED:', e.message || e); process.exit(1); });
