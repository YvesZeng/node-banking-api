import { bankAccountFixture } from '../../__fixtures__/bank-account.fixture';
import { InsufficientFundsError } from '@domain/errors/insufficient-funds';

describe('Domain | Entities | BankAccount', () => {
    describe('Test transferIn', () => {
        it('should add value to current account balance', () => {
            const bankAccount = bankAccountFixture;
            const currentBankAccountBalance = bankAccount.balance;
            const transferValue = 200;
            const expectedBalance = currentBankAccountBalance + transferValue;

            bankAccount.transferIn(transferValue);

            expect(bankAccount.balance).toEqual(expectedBalance);
        });
    });

    describe('Test transferOut', () => {
        describe('when transfer value is greater than current balance', () => {
            it('should throw insufficient funds error', () => {
                const bankAccount = bankAccountFixture;
                const transferValue = bankAccount.balance + 100;

                expect(() => {
                    bankAccount.transferOut(transferValue);
                }).toThrowError(
                    new InsufficientFundsError(
                        `Account ${bankAccount.id} has not enough funds to complete this transfer`,
                    ),
                );
            });
        });

        describe('when transfer value is less than current balance', () => {
            it('should remove transfer value from current account balance', () => {
                const bankAccount = bankAccountFixture;
                const transferValue = bankAccount.balance - 5;
                const expectedBalance = bankAccount.balance - transferValue;

                bankAccount.transferOut(transferValue);

                expect(bankAccount.balance).toEqual(expectedBalance);
            });
        });

        describe('when transfer value equals current balance', () => {
            it('should allow exact balance transfer leaving zero balance', () => {
                const bankAccount = bankAccountFixture;
                const transferValue = bankAccount.balance;
                const expectedBalance = 0;

                bankAccount.transferOut(transferValue);

                expect(bankAccount.balance).toEqual(expectedBalance);
            });
        });
    });
});
