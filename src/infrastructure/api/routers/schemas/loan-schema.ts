import { Schema } from 'express-validator/src/middlewares/schema';

export const createLoanSchema: Schema = {
    accountId: { errorMessage: 'Invalid account id', isInt: { options: { gt: 0 } }, in: ['body'] },
    principalAmount: { errorMessage: 'Invalid principal amount', isFloat: { options: { gt: 0 } }, in: ['body'] },
    interestRate: { errorMessage: 'Invalid interest rate', isFloat: { options: { min: 0 } }, in: ['body'] },
    termMonths: { errorMessage: 'Invalid term months', isInt: { options: { gt: 0 } }, in: ['body'] },
};

export const makePaymentSchema: Schema = {
    amount: { errorMessage: 'Invalid payment amount', isFloat: { options: { gt: 0 } }, in: ['body'] },
};
