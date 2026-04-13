import { inject, injectable } from 'inversify';
import { LoanRepository } from '@domain/repositories/loan-repository';
import { TYPES } from '@shared/types';

export interface AmortizationScheduleEntry {
    paymentNumber: number; paymentAmount: number; principalPortion: number;
    interestPortion: number; remainingBalance: number;
}
export interface AmortizationSchedule {
    loanId: number; principal: number; interestRate: number; termMonths: number;
    monthlyPayment: number; totalInterest: number; totalPayment: number;
    schedule: AmortizationScheduleEntry[];
}

@injectable()
export class GetLoanSchedule {
    constructor(@inject(TYPES.LoanRepository) private loanRepository: LoanRepository) {}

    async execute(loanId: number): Promise<AmortizationSchedule> {
        const loan = await this.loanRepository.getById(loanId);
        const monthlyPayment = this.calculateMonthlyPayment(loan.principalAmount, loan.interestRate, loan.termMonths);
        const schedule = this.generateAmortizationSchedule(loan.principalAmount, loan.interestRate, loan.termMonths, monthlyPayment);
        const totalInterest = schedule.reduce((sum, entry) => sum + entry.interestPortion, 0);
        const totalPayment = schedule.reduce((sum, entry) => sum + entry.paymentAmount, 0);
        return {
            loanId: loan.id!, principal: loan.principalAmount, interestRate: loan.interestRate,
            termMonths: loan.termMonths, monthlyPayment,
            totalInterest: Math.round(totalInterest * 100) / 100,
            totalPayment: Math.round(totalPayment * 100) / 100, schedule,
        };
    }

    private calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
        if (annualRate === 0) return Math.round((principal / termMonths) * 100) / 100;
        const monthlyRate = annualRate / 12 / 100;
        const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
        const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
        return Math.round((principal * (numerator / denominator)) * 100) / 100;
    }

    private generateAmortizationSchedule(principal: number, annualRate: number, termMonths: number, monthlyPayment: number): AmortizationScheduleEntry[] {
        const schedule: AmortizationScheduleEntry[] = [];
        let remainingBalance = principal;
        const monthlyRate = annualRate / 12 / 100;
        for (let paymentNumber = 1; paymentNumber <= termMonths; paymentNumber++) {
            let interestPortion: number, principalPortion: number;
            if (monthlyRate === 0) {
                interestPortion = 0;
                principalPortion = Math.round((principal / termMonths) * 100) / 100;
                if (paymentNumber === termMonths) principalPortion = Math.round(remainingBalance * 100) / 100;
            } else {
                interestPortion = Math.round(remainingBalance * monthlyRate * 100) / 100;
                principalPortion = Math.round((monthlyPayment - interestPortion) * 100) / 100;
                if (paymentNumber === termMonths || principalPortion > remainingBalance) {
                    principalPortion = Math.round(remainingBalance * 100) / 100;
                }
            }
            const actualPayment = Math.round((principalPortion + interestPortion) * 100) / 100;
            remainingBalance = Math.round((remainingBalance - principalPortion) * 100) / 100;
            if (remainingBalance < 0) remainingBalance = 0;
            schedule.push({ paymentNumber, paymentAmount: actualPayment, principalPortion, interestPortion, remainingBalance });
            if (remainingBalance <= 0) break;
        }
        return schedule;
    }
}
