import { CreateLoan } from '@application/use-cases/create-loan';
import { loanRepositoryMock } from '../../__fixtures__/loan-repository.fixture';
import { bankAccountRepositoryMock } from '../../__fixtures__/bank-account-repository.fixture';
import { LoanStatus } from '@domain/entities/loan';
import { InvalidLoanAmount } from '@domain/errors/loan-not-found';
import { BankAccount } from '@domain/entities/bank-account';
import { customerFixture } from '../../__fixtures__/customer.fixture';

describe('Application | UseCases | CreateLoan', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('validation', () => {
        it('throws error when account balance is negative', async () => {
            bankAccountRepositoryMock.getById = jest.fn(async () => new BankAccount(-100, customerFixture, 1));
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            await expect(createLoan.execute({ accountId: 1, principalAmount: 1000, interestRate: 6, termMonths: 12 }))
                .rejects.toThrow(InvalidLoanAmount);
        });

        it('throws error when loan exceeds 10x balance', async () => {
            bankAccountRepositoryMock.getById = jest.fn(async () => new BankAccount(1000, customerFixture, 1));
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            await expect(createLoan.execute({ accountId: 1, principalAmount: 15000, interestRate: 6, termMonths: 12 }))
                .rejects.toThrow(InvalidLoanAmount);
        });

        it('throws error when principal is zero', async () => {
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            await expect(createLoan.execute({ accountId: 1, principalAmount: 0, interestRate: 6, termMonths: 12 }))
                .rejects.toThrow(InvalidLoanAmount);
        });

        it('throws error when interest rate is negative', async () => {
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            await expect(createLoan.execute({ accountId: 1, principalAmount: 1000, interestRate: -5, termMonths: 12 }))
                .rejects.toThrow(InvalidLoanAmount);
        });

        it('throws error when term is zero', async () => {
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            await expect(createLoan.execute({ accountId: 1, principalAmount: 1000, interestRate: 6, termMonths: 0 }))
                .rejects.toThrow(InvalidLoanAmount);
        });
    });

    describe('successful creation', () => {
        it('creates loan when all validations pass', async () => {
            bankAccountRepositoryMock.getById = jest.fn(async () => new BankAccount(10000, customerFixture, 1));
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            const loan = await createLoan.execute({ accountId: 1, principalAmount: 5000, interestRate: 6, termMonths: 12 });
            expect(loan).toBeDefined();
            expect(loan.id).toBe(1);
            expect(loan.status).toBe(LoanStatus.ACTIVE);
        });

        it('allows zero interest rate', async () => {
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            const loan = await createLoan.execute({ accountId: 1, principalAmount: 1000, interestRate: 0, termMonths: 12 });
            expect(loan.interestRate).toBe(0);
        });

        it('allows 1-month term', async () => {
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            const loan = await createLoan.execute({ accountId: 1, principalAmount: 1000, interestRate: 6, termMonths: 1 });
            expect(loan.termMonths).toBe(1);
        });

        it('allows exactly 10x balance', async () => {
            bankAccountRepositoryMock.getById = jest.fn(async () => new BankAccount(1000, customerFixture, 1));
            const createLoan = new CreateLoan(loanRepositoryMock, bankAccountRepositoryMock);
            const loan = await createLoan.execute({ accountId: 1, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            expect(loan).toBeDefined();
        });
    });
});
