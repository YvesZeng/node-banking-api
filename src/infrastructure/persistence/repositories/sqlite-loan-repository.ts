import { injectable } from 'inversify';
import { LoanRepository } from '@domain/repositories/loan-repository';
import { Loan, LoanStatus } from '@domain/entities/loan';
import { LoanNotFound } from '@domain/errors/loan-not-found';
import { getDatabase } from '../sqlite';

interface LoanRow {
    id: number;
    account_id: number;
    principal_amount: number;
    interest_rate: number;
    term_months: number;
    start_date: string;
    status: string;
    remaining_balance: number;
    total_paid: number;
    missed_payments: number;
}

@injectable()
export class SQLiteLoanRepository implements LoanRepository {
    getById(id: number): Promise<Loan> {
        const db = getDatabase();
        const row = db.prepare('SELECT * FROM loans WHERE id = ?').get(id) as LoanRow | undefined;
        if (!row) throw new LoanNotFound(`Loan with id ${id} not found`);
        return Promise.resolve(this.mapRowToLoan(row));
    }

    findByAccountId(accountId: number): Promise<Loan[]> {
        const db = getDatabase();
        const rows = db.prepare('SELECT * FROM loans WHERE account_id = ?').all(accountId) as LoanRow[];
        return Promise.resolve(rows.map((row) => this.mapRowToLoan(row)));
    }

    save(loan: Loan): Promise<Loan> {
        const db = getDatabase();
        const result = db.prepare(`INSERT INTO loans (account_id, principal_amount, interest_rate, term_months, start_date, status, remaining_balance, total_paid, missed_payments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            loan.accountId, Math.round(loan.principalAmount * 100), loan.interestRate, loan.termMonths,
            loan.startDate.toISOString(), loan.status, Math.round(loan.remainingBalance! * 100),
            Math.round(loan.totalPaid! * 100), loan.missedPayments!);
        loan.id = result.lastInsertRowid as number;
        return Promise.resolve(loan);
    }

    update(loan: Loan): Promise<void> {
        const db = getDatabase();
        const result = db.prepare(`UPDATE loans SET remaining_balance = ?, total_paid = ?, missed_payments = ?, status = ? WHERE id = ?`).run(
            Math.round(loan.remainingBalance! * 100), Math.round(loan.totalPaid! * 100),
            loan.missedPayments!, loan.status, loan.id);
        if (result.changes === 0) throw new LoanNotFound(`Loan with id ${loan.id} not found`);
        return Promise.resolve();
    }

    private mapRowToLoan(row: LoanRow): Loan {
        return new Loan(row.account_id, row.principal_amount / 100, row.interest_rate, row.term_months,
            new Date(row.start_date), row.status as LoanStatus, row.id, row.remaining_balance / 100,
            row.total_paid / 100, row.missed_payments);
    }
}
