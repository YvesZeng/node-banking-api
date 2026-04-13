const TYPES = {
    CustomerRepository: Symbol.for('CustomerRepository'),
    BankAccountRepository: Symbol.for('BankAccountRepository'),
    TransferRepository: Symbol.for('TransferRepository'),
    LoanRepository: Symbol.for('LoanRepository'),
    RetrieveBankAccountBalance: Symbol.for('RetrieveBankAccountBalance'),
    CreateBankAccount: Symbol.for('CreateBankAccount'),
    TransferAmount: Symbol.for('TransferAmount'),
    ListTransferHistory: Symbol.for('ListTransferHistory'),
    CreateLoan: Symbol.for('CreateLoan'),
    MakeLoanPayment: Symbol.for('MakeLoanPayment'),
    GetLoanSchedule: Symbol.for('GetLoanSchedule'),
};
export { TYPES };
