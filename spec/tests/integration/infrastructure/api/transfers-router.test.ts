import supertest from 'supertest';
import StatusCodes from 'http-status-codes';
import { SuperTest, Test, Response } from 'supertest';
import app from '../../../../../src/infrastructure/api/server';
import { container } from '../../../../../src/infrastructure/dependency-container';
import { TYPES } from '@shared/types';
import { BankAccountRepository } from '@domain/repositories/bank-account-repository';
import { customerFixture } from '../../../__fixtures__/customer.fixture';
import { BankAccount } from '@domain/entities/bank-account';
const { setupDB } = require('../../../setupTests');

describe('Infrastructure | API | TransfersRouter', () => {
    let agent: SuperTest<Test>;

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2022-01-01'));
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    beforeAll((done) => {
        agent = supertest.agent(app);
        done();
    });

    /***********************************************************************************
     *                                    Test POST
     **********************************************************************************/

    describe('Test POST /transfers', () => {
        it('should return 404 when the original account is invalid', async () => {
            const bankAccountRepository = container.get<BankAccountRepository>(
                TYPES.BankAccountRepository,
            );
            const toBankAccount = new BankAccount(100, customerFixture);
            await bankAccountRepository.save(toBankAccount);
            const payload = {
                fromBankAccountId: 99999,
                toBankAccountId: toBankAccount.id,
                amount: 50,
            };
            const expectedResponse = {
                message: `Bank account with id ${payload.fromBankAccountId} not found`,
            };

            const res = await agent.post('/api/transfers').send(payload);

            expect(res.status).toBe(StatusCodes.NOT_FOUND);
            expect(res.body).toStrictEqual(expectedResponse);
        });

        it('should return 404 when the toBankAccount id is invalid', async () => {
            const bankAccountRepository = container.get<BankAccountRepository>(
                TYPES.BankAccountRepository,
            );
            const fromBankAccount = new BankAccount(100, customerFixture);
            await bankAccountRepository.save(fromBankAccount);
            const payload = {
                fromBankAccountId: fromBankAccount.id,
                toBankAccountId: 99999,
                amount: 50,
            };
            const expectedResponse = {
                message: `Bank account with id ${payload.toBankAccountId} not found`,
            };

            const res = await agent.post('/api/transfers').send(payload);

            expect(res.status).toBe(StatusCodes.NOT_FOUND);
            expect(res.body).toStrictEqual(expectedResponse);
        });

        it('should return 201 and the transfer data when the payload is valid', async () => {
            const bankAccountRepository = container.get<BankAccountRepository>(
                TYPES.BankAccountRepository,
            );
            const toBankAccount = new BankAccount(100, customerFixture);
            const fromBankAccount = new BankAccount(100, customerFixture);
            await bankAccountRepository.save(fromBankAccount);
            await bankAccountRepository.save(toBankAccount);
            const payload = {
                fromBankAccountId: fromBankAccount.id,
                toBankAccountId: toBankAccount.id,
                amount: 50,
            };

            const res = await agent.post('/api/transfers').send(payload);

            const expectedResponse = {
                fromBankAccountId: fromBankAccount.id,
                toBankAccountId: toBankAccount.id,
                amount: payload.amount,
                referenceDate: new Date().toISOString(),
                id: res.body.id,
            };
            expect(res.status).toBe(StatusCodes.CREATED);
            expect(res.body).toStrictEqual(expectedResponse);
        });

        it('should return 422 when there are no funds available to be transfered', async () => {
            const bankAccountRepository = container.get<BankAccountRepository>(
                TYPES.BankAccountRepository,
            );
            const toBankAccount = new BankAccount(100, customerFixture);
            const fromBankAccount = new BankAccount(100, customerFixture);
            await bankAccountRepository.save(fromBankAccount);
            await bankAccountRepository.save(toBankAccount);
            const payload = {
                fromBankAccountId: fromBankAccount.id,
                toBankAccountId: toBankAccount.id,
                amount: 500,
            };
            const expectedResponse = {
                message: `Account ${fromBankAccount.id} has not enough funds to complete this transfer`,
            };

            const res = await agent.post('/api/transfers').send(payload);

            expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
            expect(res.body).toStrictEqual(expectedResponse);
        });
    });
});
