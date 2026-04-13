import { LoanRepository } from '@domain/repositories/loan-repository';
import { Loan } from '@domain/entities/loan';
import { createLoanFixture } from './loan.fixture';

export const loanRepositoryMock: LoanRepository = {
    getById: jest.fn(async (id: number) => createLoanFixture({ id })),
    findByAccountId: jest.fn(async (accountId: number) => [createLoanFixture({ accountId })]),
    save: jest.fn(async (loan: Loan) => { loan.id = 1; return loan; }),
    update: jest.fn(async (loan: Loan) => {}),
};
