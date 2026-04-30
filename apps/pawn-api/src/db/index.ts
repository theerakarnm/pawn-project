import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from './schema.ts';

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema,
});
