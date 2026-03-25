import { Schema } from 'express-validator/src/middlewares/schema';

export const newBankAccountSchema: Schema = {
    customerId: {
        errorMessage: 'Invalid customer id',
        isInt: {
            options: {
                gt: 0,
            },
        },
        in: ['body'],
    },
    depositAmount: {
        optional: true,
        errorMessage: 'Invalid deposit amount',
        isInt: {
            options: {
                gt: 0,
            },
        },
        in: ['body'],
    },
};
