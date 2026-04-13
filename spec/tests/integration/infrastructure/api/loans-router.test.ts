import supertest from 'supertest';
import StatusCodes from 'http-status-codes';
import { SuperTest, Test, Response } from 'supertest';
import app from '../../../../../src/infrastructure/api/server';
import { container } from '../../../../../src/infrastructure/dependency-container';
import { TYPES } from '@shared/types';
import { BankAccountRepository } from '@domain/repositories/bank-account-repository';
import { BankAccount } from '@domain/entities/bank-account';
const { setupDB } = require('../../../setupTests');

describe('Infrastructure | API | LoansRouter', () => {
    let agent: SuperTest<Test>;
    setupDB();

    beforeAll((done) => { agent = supertest.agent(app); jest.resetAllMocks(); done(); });

    describe('POST /api/loans', () => {
        it('returns 400 when invalid account id', (done) => {
            agent.post('/api/loans').send({ accountId: 'invalid', principalAmount: 1000, interestRate: 6, termMonths: 12 })
                .end((err: Error, res: Response) => { expect(res.status).toBe(StatusCodes.BAD_REQUEST); done(); });
        });

        it('returns 404 when account not found', (done) => {
            agent.post('/api/loans').send({ accountId: 999, principalAmount: 1000, interestRate: 6, termMonths: 12 })
                .end((err: Error, res: Response) => { expect(res.status).toBe(StatusCodes.NOT_FOUND); done(); });
        });

        it('returns 400 when balance is negative', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(-100, { id: '1', name: 'Test' }));
            const res = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 1000, interestRate: 6, termMonths: 12 });
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
            expect(res.body.message).toContain('negative balance');
        });

        it('returns 400 when exceeds 10x balance', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(100, { id: '1', name: 'Test' }));
            const res = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 2000, interestRate: 6, termMonths: 12 });
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
            expect(res.body.message).toContain('exceeds maximum');
        });

        it('returns 201 when valid', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(1000, { id: '1', name: 'Test' }));
            const res = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 5000, interestRate: 6, termMonths: 12 });
            expect(res.status).toBe(StatusCodes.CREATED);
            expect(res.body.status).toBe('ACTIVE');
        });

        it('allows zero interest', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(1000, { id: '1', name: 'Test' }));
            const res = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 1000, interestRate: 0, termMonths: 12 });
            expect(res.status).toBe(StatusCodes.CREATED);
            expect(res.body.interestRate).toBe(0);
        });
    });

    describe('POST /api/loans/:id/payments', () => {
        let loanId: number;
        beforeEach(async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(1000, { id: '1', name: 'Test' }));
            const res = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            loanId = res.body.id;
        });

        it('returns 400 when invalid amount', (done) => {
            agent.post(`/api/loans/${loanId}/payments`).send({ amount: -100 })
                .end((err: Error, res: Response) => { expect(res.status).toBe(StatusCodes.BAD_REQUEST); done(); });
        });

        it('returns 200 when valid payment', async () => {
            const res = await agent.post(`/api/loans/${loanId}/payments`).send({ amount: 860.66 });
            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.principalPortion).toBeDefined();
            expect(res.body.remainingBalance).toBeLessThan(10000);
        });

        it('marks paid off when balance zero', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(1000, { id: '2', name: 'Test2' }));
            const loanRes = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 100, interestRate: 0, termMonths: 1 });
            const paymentRes = await agent.post(`/api/loans/${loanRes.body.id}/payments`).send({ amount: 100 });
            expect(paymentRes.body.loanPaidOff).toBe(true);
        });
    });

    describe('GET /api/loans/:id/schedule', () => {
        let loanId: number;
        beforeEach(async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(1000, { id: '1', name: 'Test' }));
            const res = await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 10000, interestRate: 6, termMonths: 12 });
            loanId = res.body.id;
        });

        it('returns 400 when invalid id', (done) => {
            agent.get('/api/loans/invalid/schedule').end((err: Error, res: Response) => { expect(res.status).toBe(StatusCodes.BAD_REQUEST); done(); });
        });

        it('returns 200 with schedule', async () => {
            const res = await agent.get(`/api/loans/${loanId}/schedule`);
            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.monthlyPayment).toBe(860.66);
            expect(res.body.schedule.length).toBe(12);
        });

        it('last payment has zero balance', async () => {
            const res = await agent.get(`/api/loans/${loanId}/schedule`);
            const last = res.body.schedule[res.body.schedule.length - 1];
            expect(last.remainingBalance).toBe(0);
        });
    });

    describe('GET /api/bank-accounts/:id/loans', () => {
        it('returns empty list when no loans', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(1000, { id: '1', name: 'Test' }));
            const res = await agent.get(`/api/bank-accounts/${account.id}/loans`);
            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body).toEqual([]);
        });

        it('returns loans for account', async () => {
            const repo = container.get<BankAccountRepository>(TYPES.BankAccountRepository);
            const account = await repo.save(new BankAccount(10000, { id: '1', name: 'Test' }));
            await agent.post('/api/loans').send({ accountId: account.id!, principalAmount: 5000, interestRate: 6, termMonths: 12 });
            const res = await agent.get(`/api/bank-accounts/${account.id}/loans`);
            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.length).toBe(1);
        });
    });
});
