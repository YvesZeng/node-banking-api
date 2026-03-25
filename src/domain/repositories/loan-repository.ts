import { Loan } from '@domain/entities/loan';

export interface LoanRepository {
    getById(id: number): Promise<Loan>;
    findByAccountId(accountId: number): Promise<Loan[]>;
    save(loan: Loan): Promise<Loan>;
    update(loan: Loan): Promise<void>;
}
