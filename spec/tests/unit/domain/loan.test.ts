import { Loan, LoanStatus } from '@domain/entities/loan';

describe('Domain | Entities | Loan', () => {
    describe('constructor', () => {
        it('creates a loan with default values for optional fields', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.PENDING);
            expect(loan.remainingBalance).toBe(10000);
            expect(loan.totalPaid).toBe(0);
            expect(loan.missedPayments).toBe(0);
            expect(loan.id).toBeUndefined();
        });
        it('creates a loan with provided optional values', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE, 1, 5000, 2000, 1);
            expect(loan.remainingBalance).toBe(5000);
            expect(loan.totalPaid).toBe(2000);
            expect(loan.missedPayments).toBe(1);
            expect(loan.id).toBe(1);
        });
    });

    describe('activate', () => {
        it('changes loan status from PENDING to ACTIVE', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.PENDING);
            loan.activate();
            expect(loan.status).toBe(LoanStatus.ACTIVE);
        });
    });

    describe('markAsPaidOff', () => {
        it('changes loan status to PAID_OFF', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE);
            loan.markAsPaidOff();
            expect(loan.status).toBe(LoanStatus.PAID_OFF);
        });
    });

    describe('markAsDefaulted', () => {
        it('changes loan status to DEFAULTED', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE);
            loan.markAsDefaulted();
            expect(loan.status).toBe(LoanStatus.DEFAULTED);
        });
    });

    describe('isPaidOff', () => {
        it('returns true when remaining balance is zero', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE, 1, 0);
            expect(loan.isPaidOff()).toBe(true);
        });
        it('returns false when remaining balance is positive', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE, 1, 5000);
            expect(loan.isPaidOff()).toBe(false);
        });
    });

    describe('shouldDefault', () => {
        it('returns true when missed payments equals 3', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE, 1, 5000, 0, 3);
            expect(loan.shouldDefault()).toBe(true);
        });
        it('returns false when missed payments is less than 3', () => {
            const loan = new Loan(1, 10000, 6, 12, new Date(), LoanStatus.ACTIVE, 1, 5000, 0, 2);
            expect(loan.shouldDefault()).toBe(false);
        });
    });

    describe('LoanStatus enum', () => {
        it('has all required statuses', () => {
            expect(LoanStatus.PENDING).toBe('PENDING');
            expect(LoanStatus.ACTIVE).toBe('ACTIVE');
            expect(LoanStatus.PAID_OFF).toBe('PAID_OFF');
            expect(LoanStatus.DEFAULTED).toBe('DEFAULTED');
        });
    });
});
