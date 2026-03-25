import Database from 'better-sqlite3';
import { initDatabase } from './init-database';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
    if (!db) {
        const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'database.sqlite');
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        initDatabase(db);
    }
    return db;
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}
