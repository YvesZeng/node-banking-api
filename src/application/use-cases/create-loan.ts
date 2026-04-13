import { inject, injectable } from 'inversify';
import { LoanRepository } from '@domain/repositories/loan-repository';
import { TYPES } from '@shared/types';
import { Loan, LoanStatus } from '@domain/entities/loan';
import { BankAccountRepository } from '@domain/repositories/bank-account-repository';
import { InvalidLoanAmount } from '@domain/errors/loan-not-found';

export interface CreateLoanData {
    accountId: number;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
}

@injectable()
export class CreateLoan {
    constructor(
        @inject(TYPES.LoanRepository) private loanRepository: LoanRepository,
        @inject(TYPES.BankAccountRepository) private bankAccountRepository: BankAccountRepository,
    ) {}

    async execute(loanData: CreateLoanData): Promise<Loan> {
        const account = await this.bankAccountRepository.getById(loanData.accountId);
        if (account.balance < 0) {
            throw new InvalidLoanAmount('Cannot create loan for account with negative balance');
        }
        const maxLoanAmount = account.balance * 10;
        if (loanData.principalAmount > maxLoanAmount) {
            throw new InvalidLoanAmount(`Loan amount exceeds maximum allowed (${maxLoanAmount}). Maximum loan is 10x current balance.`);
        }
        if (loanData.principalAmount <= 0) throw new InvalidLoanAmount('Loan amount must be greater than zero');
        if (loanData.interestRate < 0) throw new InvalidLoanAmount('Interest rate cannot be negative');
        if (loanData.termMonths <= 0) throw new InvalidLoanAmount('Loan term must be at least 1 month');

        const loan = new Loan(loanData.accountId, loanData.principalAmount, loanData.interestRate,
            loanData.termMonths, new Date(), LoanStatus.PENDING);
        const savedLoan = await this.loanRepository.save(loan);
        savedLoan.activate();
        await this.loanRepository.update(savedLoan);
        return savedLoan;
    }
}
