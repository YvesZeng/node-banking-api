import { injectable } from 'inversify';
import { BankAccountRepository } from '@domain/repositories/bank-account-repository';
import { BankAccount } from '@domain/entities/bank-account';
import { BankAccountNotFound } from '@domain/errors/bank-account-not-found';
import { Customer } from '@domain/entities/customer';
import { getDatabase } from '../sqlite';

@injectable()
export class SQLiteBankAccountRepository implements BankAccountRepository {
    async getById(id: number): Promise<BankAccount> {
        const db = getDatabase();
        const row = db.prepare(`
            SELECT ba.id, ba.balance, ba.customer_id, c.id as customer_id, c.name as customer_name
            FROM bank_accounts ba
            JOIN customers c ON ba.customer_id = c.id
            WHERE ba.id = ?
        `).get(id) as any;

        if (!row) {
            throw new BankAccountNotFound(`Bank account with id ${id} not found`);
        }

        const customer: Customer = {
            id: row.customer_id.toString(),
            name: row.customer_name,
        };

        return new BankAccount(row.balance, customer, row.id);
    }

    async listByCustomer(customerId: string): Promise<BankAccount[]> {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT ba.id, ba.balance, ba.customer_id, c.id as customer_id, c.name as customer_name
            FROM bank_accounts ba
            JOIN customers c ON ba.customer_id = c.id
            WHERE ba.customer_id = ?
        `).all(parseInt(customerId)) as any[];

        return rows.map((row) => {
            const customer: Customer = {
                id: row.customer_id.toString(),
                name: row.customer_name,
            };
            return new BankAccount(row.balance, customer, row.id);
        });
    }

    async save(bankAccount: BankAccount): Promise<BankAccount> {
        const db = getDatabase();
        const result = db.prepare(`
            INSERT INTO bank_accounts (customer_id, balance)
            VALUES (?, ?)
        `).run(parseInt(bankAccount.customer.id), bankAccount.balance);

        bankAccount.id = result.lastInsertRowid as number;
        return bankAccount;
    }

    async update(bankAccount: BankAccount): Promise<void> {
        const db = getDatabase();
        const result = db.prepare(`
            UPDATE bank_accounts
            SET balance = ?
            WHERE id = ?
        `).run(bankAccount.balance, bankAccount.id);

        if (result.changes === 0) {
            throw new BankAccountNotFound(`Bank account with id ${bankAccount.id} not found`);
        }
    }
}
