import { Container } from 'inversify';
import { TYPES } from '@shared/types';
import { CustomerRepository } from '@domain/repositories/customer-repository';
import { SQLiteCustomerRepository } from '@repositories/sqlite-customer-repository';
import { SQLiteBankAccountRepository } from '@repositories/sqlite-bank-account-repository';
import { BankAccountRepository } from '@domain/repositories/bank-account-repository';
import { RetrieveBankAccountBalance } from '@application/queries/retrieve-bank-account-balance';
import { CreateBankAccount } from '@application/use-cases/create-bank-account';
import { TransferAmount } from '@application/use-cases/transfer-amount';
import { SQLiteTransferRepository } from '@repositories/sqlite-transfer-repository';
import { TransferRepository } from '@domain/repositories/transfer-repository';
import { ListTransferHistory } from '@application/queries/list-transfer-history';

const container = new Container();
container
    .bind<CustomerRepository>(TYPES.CustomerRepository)
    .to(SQLiteCustomerRepository)
    .inSingletonScope();
container
    .bind<BankAccountRepository>(TYPES.BankAccountRepository)
    .to(SQLiteBankAccountRepository)
    .inSingletonScope();
container
    .bind<TransferRepository>(TYPES.TransferRepository)
    .to(SQLiteTransferRepository)
    .inSingletonScope();

container
    .bind<RetrieveBankAccountBalance>(TYPES.RetrieveBankAccountBalance)
    .to(RetrieveBankAccountBalance);
container.bind<CreateBankAccount>(TYPES.CreateBankAccount).to(CreateBankAccount);
container.bind<TransferAmount>(TYPES.TransferAmount).to(TransferAmount);
container.bind<ListTransferHistory>(TYPES.ListTransferHistory).to(ListTransferHistory);
export { container };
