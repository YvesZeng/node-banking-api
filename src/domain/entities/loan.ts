export enum LoanStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    PAID_OFF = 'PAID_OFF',
    DEFAULTED = 'DEFAULTED',
}

export class Loan {
    constructor(
        public accountId: number,
        public principalAmount: number,
        public interestRate: number,
        public termMonths: number,
        public startDate: Date,
        public status: LoanStatus,
        public id?: number,
        public remainingBalance?: number,
        public totalPaid?: number,
        public missedPayments?: number,
    ) {
        this.remainingBalance = remainingBalance ?? principalAmount;
        this.totalPaid = totalPaid ?? 0;
        this.missedPayments = missedPayments ?? 0;
    }

    activate(): void {
        this.status = LoanStatus.ACTIVE;
    }

    markAsPaidOff(): void {
        this.status = LoanStatus.PAID_OFF;
    }

    markAsDefaulted(): void {
        this.status = LoanStatus.DEFAULTED;
    }

    isPaidOff(): boolean {
        return (this.remainingBalance ?? 0) <= 0;
    }

    shouldDefault(): boolean {
        return (this.missedPayments ?? 0) >= 3;
    }
}
