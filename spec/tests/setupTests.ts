import 'reflect-metadata';
import { getDatabase, closeDatabase } from '../../src/infrastructure/persistence/sqlite';
import Database from 'better-sqlite3';

let db: Database.Database;

module.exports = {
    setupDB() {
        beforeAll(() => {
            process.env.SQLITE_DB_PATH = ':memory:';
            db = getDatabase();
            
            // Seed initial customers
            const insert = db.prepare('INSERT INTO customers (name) VALUES (?)');
            const names = ['Arisha Barron', 'Branden Gibson', 'Rhonda Church', 'Georgina Hazel'];
            for (const name of names) {
                insert.run(name);
            }
        });

        beforeEach(() => {
            db.exec('DELETE FROM transfers');
            db.exec('DELETE FROM bank_accounts');
        });

        afterEach(() => {
            db.exec('DELETE FROM transfers');
            db.exec('DELETE FROM bank_accounts');
        });

        afterAll(() => {
            closeDatabase();
        });
    },
};
