import { drizzle } from 'drizzle-orm/neon-http';
import { dbRelations } from './schema';

const db = drizzle(process.env.DATABASE_URL!, { relations: dbRelations });

export { db };