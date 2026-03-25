import { inject, injectable } from 'inversify';
import { LoanRepository } from '@domain/repositories/loan-repository';
import { TYPES } from '@shared/types';
import { Loan, LoanStatus } from '@domain/entities/loan';
import { InvalidPaymentAmount } from '@domain/errors/loan-not-found';
import { getDatabase } from '@infrastructure/persistence/sqlite';

export interface MakePaymentData { loanId: number; amount: number; }
export interface PaymentResult { principalPortion: number; interestPortion: number; remainingBalance: number; loanPaidOff: boolean; }

@injectable()
export class MakeLoanPayment {
    constructor(@inject(TYPES.LoanRepository) private loanRepository: LoanRepository) {}

    async execute(paymentData: MakePaymentData): Promise<PaymentResult> {
        const loan = await this.loanRepository.getById(paymentData.loanId);
        if (paymentData.amount <= 0) throw new InvalidPaymentAmount('Payment amount must be greater than zero');
        if (loan.status === LoanStatus.PAID_OFF || loan.status === LoanStatus.DEFAULTED) {
            throw new InvalidPaymentAmount('Cannot make payment on this loan');
        }

        const monthlyRate = loan.interestRate / 12 / 100;
        let interestPortion: number, principalPortion: number;
        if (monthlyRate === 0) {
            interestPortion = 0;
            principalPortion = Math.min(paymentData.amount, loan.remainingBalance!);
        } else {
            interestPortion = Math.round(loan.remainingBalance! * monthlyRate * 100) / 100;
            principalPortion = Math.min(Math.round((paymentData.amount - interestPortion) * 100) / 100, loan.remainingBalance!);
        }
        if (principalPortion < 0) { principalPortion = 0; interestPortion = Math.min(paymentData.amount, interestPortion); }

        const newRemainingBalance = Math.round((loan.remainingBalance! - principalPortion) * 100) / 100;
        const newTotalPaid = Math.round((loan.totalPaid! + paymentData.amount) * 100) / 100;
        loan.remainingBalance = newRemainingBalance;
        loan.totalPaid = newTotalPaid;
        loan.missedPayments = 0;
        if (loan.isPaidOff()) loan.markAsPaidOff();
        await this.loanRepository.update(loan);

        const paymentNumber = (await this.getPaymentCount(loan.id!)) + 1;
        await this.savePaymentRecord(loan.id!, principalPortion, interestPortion, paymentData.amount, paymentNumber);
        return { principalPortion, interestPortion, remainingBalance: newRemainingBalance, loanPaidOff: loan.isPaidOff() };
    }

    private async getPaymentCount(loanId: number): Promise<number> {
        const db = getDatabase();
        const result = db.prepare('SELECT COUNT(*) as count FROM loan_payments WHERE loan_id = ?').get(loanId) as { count: number };
        return result.count;
    }

    private async savePaymentRecord(loanId: number, principalPortion: number, interestPortion: number, totalAmount: number, paymentNumber: number): Promise<void> {
        const db = getDatabase();
        db.prepare(`INSERT INTO loan_payments (loan_id, amount, principal_portion, interest_portion, payment_date, payment_number) VALUES (?, ?, ?, ?, ?, ?)`).run(
            loanId, Math.round(totalAmount * 100), Math.round(principalPortion * 100), Math.round(interestPortion * 100), new Date().toISOString(), paymentNumber);
    }

    public calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
        if (annualRate === 0) return Math.round((principal / termMonths) * 100) / 100;
        const monthlyRate = annualRate / 12 / 100;
        const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
        const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
        return Math.round((principal * (numerator / denominator)) * 100) / 100;
    }

    public async incrementMissedPayments(loanId: number): Promise<void> {
        const loan = await this.loanRepository.getById(loanId);
        loan.missedPayments = (loan.missedPayments ?? 0) + 1;
        if (loan.shouldDefault()) loan.markAsDefaulted();
        await this.loanRepository.update(loan);
    }
}
