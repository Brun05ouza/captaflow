import { config } from 'dotenv';
import { ne } from 'drizzle-orm';
import { db, getPool } from '../src/db';
import { leads } from '../src/db/schema';
import { recalculateLead } from '../src/features/leads/service';
import { SCORING_METHOD } from '../src/features/scoring/engine';
config({ path: '.env.local', quiet: true });
// Only derived classification is updated. Prior factors remain immutable, and an event keeps the prior score/version.
const rows = await db()
  .select({ id: leads.id, workspaceId: leads.workspaceId })
  .from(leads)
  .where(ne(leads.scoringMethod, SCORING_METHOD));
for (const row of rows) await recalculateLead(row.workspaceId, row.id);
console.log(
  `${rows.length} avaliações atualizadas; cadastros, fatores anteriores e histórico preservados.`,
);
await getPool().end();
