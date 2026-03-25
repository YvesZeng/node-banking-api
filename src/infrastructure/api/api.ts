import { Router } from 'express';
import bankAccountsRouter from './routers/bank-accounts-router';
import transfersRouter from './routers/transfers-router';
import loansRouter from './routers/loans-router';

const baseRouter = Router();
baseRouter.use('/bank-accounts', bankAccountsRouter);
baseRouter.use('/transfers', transfersRouter);
baseRouter.use('/loans', loansRouter);
export default baseRouter;
