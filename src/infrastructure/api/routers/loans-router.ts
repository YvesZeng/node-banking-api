import { Router, Request, Response } from 'express';
import { container } from '../../dependency-container';
import { StatusCodes } from 'http-status-codes';
import { checkSchema, validationResult } from 'express-validator';
import { createLoanSchema, makePaymentSchema } from './schemas/loan-schema';
import { CreateLoan } from '@application/use-cases/create-loan';
import { TYPES } from '@shared/types';
import { MakeLoanPayment } from '@application/use-cases/make-loan-payment';
import { GetLoanSchedule } from '@application/queries/get-loan-schedule';
import { LoanNotFound } from '@domain/errors/loan-not-found';
import { BankAccountNotFound } from '@domain/errors/bank-account-not-found';
import { InvalidLoanAmount, InvalidPaymentAmount } from '@domain/errors/loan-not-found';

const router = Router();

router.post('/', checkSchema(createLoanSchema), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    const createLoan = container.get<CreateLoan>(TYPES.CreateLoan);
    const loanData = { accountId: req.body.accountId, principalAmount: req.body.principalAmount,
        interestRate: req.body.interestRate, termMonths: req.body.termMonths };
    try {
        const loan = await createLoan.execute(loanData);
        return res.status(StatusCodes.CREATED).json(loan);
    } catch (err) {
        if (err instanceof BankAccountNotFound) return res.status(StatusCodes.NOT_FOUND).json({ message: err.message });
        if (err instanceof InvalidLoanAmount) return res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
    }
});

router.post('/:loanId/payments', checkSchema(makePaymentSchema), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    const { loanId } = req.params;
    if (!parseInt(loanId)) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Loan id needs to be an integer' });
    const makeLoanPayment = container.get<MakeLoanPayment>(TYPES.MakeLoanPayment);
    const paymentData = { loanId: parseInt(loanId), amount: req.body.amount };
    try {
        const result = await makeLoanPayment.execute(paymentData);
        return res.status(StatusCodes.OK).json(result);
    } catch (err) {
        if (err instanceof LoanNotFound) return res.status(StatusCodes.NOT_FOUND).json({ message: err.message });
        if (err instanceof InvalidPaymentAmount) return res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
    }
});

router.get('/:loanId/schedule', async (req: Request, res: Response) => {
    const { loanId } = req.params;
    if (!parseInt(loanId)) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Loan id needs to be an integer' });
    const getLoanSchedule = container.get<GetLoanSchedule>(TYPES.GetLoanSchedule);
    try {
        const schedule = await getLoanSchedule.execute(parseInt(loanId));
        return res.status(StatusCodes.OK).json(schedule);
    } catch (err) {
        if (err instanceof LoanNotFound) return res.status(StatusCodes.NOT_FOUND).json({ message: err.message });
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
    }
});

export default router;
