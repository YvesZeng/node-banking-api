import { GetLoanSchedule } from '@application/queries/get-loan-schedule';
import { loanRepositoryMock } from '../../__fixtures__/loan-repository.fixture';
import { createLoanFixture } from '../../__fixtures__/loan.fixture';

describe('Application | Queries | GetLoanSchedule', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('execute', () => {
        it('returns schedule with correct structure', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            expect(schedule).toBeDefined();
            expect(schedule.loanId).toBe(1);
            expect(schedule.principal).toBe(10000);
            expect(schedule.monthlyPayment).toBe(860.66);
            expect(schedule.schedule.length).toBe(12);
        });

        it('calculates correct monthly payment', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            expect(schedule.monthlyPayment).toBe(860.66);
        });

        it('final balance is zero', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            const lastEntry = schedule.schedule[schedule.schedule.length - 1];
            expect(lastEntry.remainingBalance).toBe(0);
        });

        it('handles zero interest', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 12000, interestRate: 0, termMonths: 12 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            expect(schedule.monthlyPayment).toBe(1000);
            expect(schedule.totalInterest).toBe(0);
        });

        it('handles 1-month term', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 1000, interestRate: 6, termMonths: 1 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            expect(schedule.schedule.length).toBe(1);
            expect(schedule.schedule[0].remainingBalance).toBe(0);
        });

        it('no money leakage: sum equals principal + interest', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            const sumOfPayments = schedule.schedule.reduce((sum, e) => sum + e.paymentAmount, 0);
            expect(sumOfPayments).toBeCloseTo(schedule.principal + schedule.totalInterest, 2);
        });

        it('all values rounded to 2 decimals', async () => {
            const loan = createLoanFixture({ id: 1, principalAmount: 10000, interestRate: 6.123, termMonths: 12 });
            loanRepositoryMock.getById = jest.fn(async () => loan);
            const query = new GetLoanSchedule(loanRepositoryMock);
            const schedule = await query.execute(1);
            expect(Math.round(schedule.monthlyPayment * 100) / 100).toBe(schedule.monthlyPayment);
            schedule.schedule.forEach(e => {
                expect(Math.round(e.paymentAmount * 100) / 100).toBe(e.paymentAmount);
            });
        });
    });
});
