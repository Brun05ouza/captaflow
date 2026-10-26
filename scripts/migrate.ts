import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, getPool } from '../src/db';
config({ path: '.env.local' });
await migrate(db(), { migrationsFolder: './drizzle' });
console.log('Migrations aplicadas.');
await getPool().end();
