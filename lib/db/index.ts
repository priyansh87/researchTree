import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
// In drizzle v0.30+, the recommended way to instantiate is:
// export const db = drizzle({ client: sql, schema });
// For compatibility, we can also use drizzle(sql, { schema }) depending on drizzle version.
// Let's export it dynamically:
// export const db = drizzle(sql, { schema }); is also widely supported.
