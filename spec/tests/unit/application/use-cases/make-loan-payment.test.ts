import { MakeLoanPayment } from '@application/use-cases/make-loan-payment';
import { loanRepositoryMock } from '../../__fixtures__/loan-repository.fixture';
import { Loan, LoanStatus } from '@domain/entities/loan';
import { InvalidPaymentAmount } from '@domain/errors/loan-not-found';
import { createLoanFixture } from '../../__fixtures__/loan.fixture';

describe('Application | UseCases | MakeLoanPayment', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('calculateMonthlyPayment', () => {
        it('calculates correct payment for standard loan', () => {
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            expect(useCase.calculateMonthlyPayment(10000, 6, 12)).toBe(860.66);
        });
        it('handles zero interest', () => {
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            expect(useCase.calculateMonthlyPayment(12000, 0, 12)).toBe(1000);
        });
        it('handles 1-month term', () => {
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            expect(useCase.calculateMonthlyPayment(1000, 12, 1)).toBe(1010);
        });
    });

    describe('execute', () => {
        it('throws when payment amount is zero', async () => {
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            await expect(useCase.execute({ loanId: 1, amount: 0 })).rejects.toThrow(InvalidPaymentAmount);
        });

        it('throws when loan is paid off', async () => {
            loanRepositoryMock.getById = jest.fn(async () => createLoanFixture({ status: LoanStatus.PAID_OFF, remainingBalance: 0 }));
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            await expect(useCase.execute({ loanId: 1, amount: 100 })).rejects.toThrow(InvalidPaymentAmount);
        });

        it('splits payment into principal and interest', async () => {
            const loan = createLoanFixture({ id: 1, remainingBalance: 10000, interestRate: 6, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            const result = await useCase.execute({ loanId: 1, amount: 860.66 });
            expect(result.principalPortion).toBeGreaterThan(0);
            expect(result.interestPortion).toBeGreaterThan(0);
        });

        it('calculates interest correctly (6% on 10000)', async () => {
            const loan = createLoanFixture({ id: 1, remainingBalance: 10000, interestRate: 6, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            const result = await useCase.execute({ loanId: 1, amount: 860.66 });
            expect(result.interestPortion).toBe(50);
        });

        it('reduces remaining balance', async () => {
            const loan = createLoanFixture({ id: 1, remainingBalance: 10000, interestRate: 6, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            const result = await useCase.execute({ loanId: 1, amount: 860.66 });
            expect(result.remainingBalance).toBeLessThan(10000);
        });

        it('marks loan as paid off when balance is zero', async () => {
            const loan = createLoanFixture({ id: 1, remainingBalance: 500, interestRate: 0, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            const result = await useCase.execute({ loanId: 1, amount: 500 });
            expect(result.loanPaidOff).toBe(true);
            expect(loan.status).toBe(LoanStatus.PAID_OFF);
        });

        it('handles zero interest loan', async () => {
            const loan = createLoanFixture({ id: 1, remainingBalance: 1000, interestRate: 0, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            const result = await useCase.execute({ loanId: 1, amount: 100 });
            expect(result.interestPortion).toBe(0);
            expect(result.principalPortion).toBe(100);
        });
    });

    describe('incrementMissedPayments', () => {
        it('increments missed payments counter', async () => {
            const loan = createLoanFixture({ id: 1, missedPayments: 0, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            await useCase.incrementMissedPayments(1);
            expect(loan.missedPayments).toBe(1);
        });

        it('defaults loan after 3 missed payments', async () => {
            const loan = createLoanFixture({ id: 1, missedPayments: 2, status: LoanStatus.ACTIVE });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            loanRepositoryMock.update = jest.fn(async () => {});
            const useCase = new MakeLoanPayment(loanRepositoryMock);
            await useCase.incrementMissedPayments(1);
            expect(loan.missedPayments).toBe(3);
            expect(loan.status).toBe(LoanStatus.DEFAULTED);
        });
    });
});
