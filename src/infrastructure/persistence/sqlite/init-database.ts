import Database from 'better-sqlite3';

export function initDatabase(db: Database.Database): void {
    db.pragma('foreign_keys = ON');

    db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            balance INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_bank_account_id INTEGER NOT NULL,
            to_bank_account_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            reference_date TEXT NOT NULL,
            FOREIGN KEY (from_bank_account_id) REFERENCES bank_accounts(id),
            FOREIGN KEY (to_bank_account_id) REFERENCES bank_accounts(id)
        )
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_bank_accounts_customer_id
        ON bank_accounts(customer_id)
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_transfers_from_account
        ON transfers(from_bank_account_id)
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_transfers_to_account
        ON transfers(to_bank_account_id)
    `);

    const stmt = db.prepare(
        'SELECT COUNT(*) as count FROM customers',
    );
    const customerCount = stmt.get() as { count: number };
    if (customerCount.count === 0) {
        const insert = db.prepare(
            'INSERT INTO customers (name) VALUES (?)',
        );
        const names = [
            'Arisha Barron',
            'Branden Gibson',
            'Rhonda Church',
            'Georgina Hazel',
        ];

        db.transaction((names: string[]) => {
            for (const name of names) {
                insert.run(name);
            }
        })(names);
    }
}
