import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

let pool;
let db;

try {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }

    // Create Postgres pool
    pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    // Initialize Drizzle ORM
    db = drizzle(pool);

    console.log('Database connected successfully ✅');
} catch (error) {
    console.error('Failed to connect to the database ❌', error);
    process.exit(1); // Exit process if DB connection fails
}

export { pool, db };
