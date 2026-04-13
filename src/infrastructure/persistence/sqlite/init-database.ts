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
        CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            principal_amount INTEGER NOT NULL,
            interest_rate REAL NOT NULL,
            term_months INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            remaining_balance INTEGER NOT NULL,
            total_paid INTEGER NOT NULL DEFAULT 0,
            missed_payments INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS loan_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            principal_portion INTEGER NOT NULL,
            interest_portion INTEGER NOT NULL,
            payment_date TEXT NOT NULL,
            payment_number INTEGER NOT NULL,
            FOREIGN KEY (loan_id) REFERENCES loans(id)
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

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_loans_account_id
        ON loans(account_id)
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id
        ON loan_payments(loan_id)
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
