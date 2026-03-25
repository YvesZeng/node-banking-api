import { inject, injectable } from 'inversify';
import { BankAccountRepository } from '@domain/repositories/bank-account-repository';
import { TYPES } from '@shared/types';
import { TransferDTO } from '@application/dtos/transfer-dto';
import { TransferRepository } from '@domain/repositories/transfer-repository';
import { Transfer } from '@domain/entities/transfer';

@injectable()
export class TransferAmount {
    constructor(
        @inject(TYPES.BankAccountRepository) private bankAccountRepository: BankAccountRepository,
        @inject(TYPES.TransferRepository) private transferRepository: TransferRepository,
    ) {}

    async execute(transferData: TransferDTO): Promise<Transfer> {
        const fromBankAccount = await this.bankAccountRepository.getById(
            transferData.fromBankAccountId,
        );
        const toBankAccount = await this.bankAccountRepository.getById(
            transferData.toBankAccountId,
        );

        fromBankAccount.transferOut(transferData.amount);
        toBankAccount.transferIn(transferData.amount);
        const transfer: Transfer = {
            fromBankAccountId: fromBankAccount.id!,
            toBankAccountId: toBankAccount.id!,
            referenceDate: new Date(),
            amount: transferData.amount,
        };

        await this.bankAccountRepository.update(fromBankAccount);
        await this.bankAccountRepository.update(toBankAccount);
        await this.transferRepository.save(transfer);
        return transfer;
    }
}
