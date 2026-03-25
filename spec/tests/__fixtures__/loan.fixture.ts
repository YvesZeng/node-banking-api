import { Loan, LoanStatus } from '@domain/entities/loan';

export const createLoanFixture = (overrides?: Partial<Loan>): Loan => {
    return new Loan(
        1,
        overrides?.principalAmount ?? 10000,
        overrides?.interestRate ?? 6,
        overrides?.termMonths ?? 12,
        overrides?.startDate ?? new Date(),
        overrides?.status ?? LoanStatus.PENDING,
        overrides?.id ?? 1,
        overrides?.remainingBalance ?? 10000,
        overrides?.totalPaid ?? 0,
        overrides?.missedPayments ?? 0,
    );
};
