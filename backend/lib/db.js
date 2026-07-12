import { Pool } from 'pg';

let pool;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing");
}

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
} else {
    if (!global.postgresPool) {
        global.postgresPool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    pool = global.postgresPool;
}

export default pool;
