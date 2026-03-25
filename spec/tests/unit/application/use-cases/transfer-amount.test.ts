import { bankAccountRepositoryMock } from '../../../__fixtures__/bank-account-repository.fixture';
import { customerFixture } from '../../../__fixtures__/customer.fixture';
import { BankAccount } from '@domain/entities/bank-account';
import { TransferDTO } from '@application/dtos/transfer-dto';
import { TransferAmount } from '@application/use-cases/transfer-amount';
import { transferRepositoryMock } from '../../../__fixtures__/transfer-repository.fixture';
import { Transfer } from '@domain/entities/transfer';

describe('Application | UseCases | TransferAmount', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2022-01-01'));
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
    it('calls bankAccountRepository getById once with fromBankAccount id', async () => {
        const transferRepoMock = transferRepositoryMock();
        const fromAccount = new BankAccount(200, customerFixture, 1);
        const toAccount = new BankAccount(250, customerFixture, 2);
        const transferData: TransferDTO = {
            fromBankAccountId: 1,
            toBankAccountId: 2,
            amount: 100,
        };
        bankAccountRepositoryMock.getById = jest
            .fn()
            .mockResolvedValueOnce(fromAccount)
            .mockResolvedValueOnce(toAccount);
        const transferAmount = new TransferAmount(bankAccountRepositoryMock, transferRepoMock);

        await transferAmount.execute(transferData);

        expect(bankAccountRepositoryMock.getById).toHaveBeenNthCalledWith(
            1,
            transferData.fromBankAccountId,
        );
    });

    it('calls bankAccountRepository getById once with toBankAccountId', async () => {
        const transferRepoMock = transferRepositoryMock();
        const transferData: TransferDTO = {
            fromBankAccountId: 1,
            toBankAccountId: 2,
            amount: 100,
        };
        const fromAccount = new BankAccount(200, customerFixture, 1);
        const toAccount = new BankAccount(250, customerFixture, 2);
        bankAccountRepositoryMock.getById = jest
            .fn()
            .mockReturnValueOnce(fromAccount)
            .mockReturnValueOnce(toAccount);
        const transferAmount = new TransferAmount(bankAccountRepositoryMock, transferRepoMock);

        await transferAmount.execute(transferData);

        expect(bankAccountRepositoryMock.getById).toHaveBeenNthCalledWith(
            2,
            transferData.toBankAccountId,
        );
    });

    it('calls transfer repository save with correct transfer', async () => {
        const transferRepoMock = transferRepositoryMock();
        const fromAccount = new BankAccount(200, customerFixture, 1);
        const toAccount = new BankAccount(250, customerFixture, 2);
        bankAccountRepositoryMock.getById = jest
            .fn()
            .mockReturnValueOnce(fromAccount)
            .mockReturnValueOnce(toAccount);
        const transferData: TransferDTO = {
            fromBankAccountId: fromAccount.id!,
            toBankAccountId: toAccount.id!,
            amount: 100,
        };
        const transferAmount = new TransferAmount(bankAccountRepositoryMock, transferRepoMock);
        const transfer: Transfer = {
            fromBankAccountId: fromAccount.id!,
            toBankAccountId: toAccount.id!,
            referenceDate: new Date(),
            amount: transferData.amount,
            id: 1,
        };

        await transferAmount.execute(transferData);

        expect(transferRepoMock.save).toHaveBeenCalledWith(transfer);
    });
});
