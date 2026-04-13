export class LoanNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LoanNotFound';
    }
}

export class InvalidLoanAmount extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidLoanAmount';
    }
}

export class InvalidPaymentAmount extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidPaymentAmount';
    }
}
