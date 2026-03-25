import { injectable } from 'inversify';
import { TransferRepository } from '@domain/repositories/transfer-repository';
import { Transfer } from '@domain/entities/transfer';
import { getDatabase } from '../sqlite';

@injectable()
export class SQLiteTransferRepository implements TransferRepository {
    async save(transfer: Transfer): Promise<Transfer> {
        const db = getDatabase();
        const result = db.prepare(`
            INSERT INTO transfers (from_bank_account_id, to_bank_account_id, amount, reference_date)
            VALUES (?, ?, ?, ?)
        `).run(
            transfer.fromBankAccountId,
            transfer.toBankAccountId,
            transfer.amount,
            transfer.referenceDate.toISOString(),
        );

        transfer.id = result.lastInsertRowid as number;
        return transfer;
    }

    async listByAccount(accountId: number): Promise<Transfer[]> {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT id, from_bank_account_id, to_bank_account_id, amount, reference_date
            FROM transfers
            WHERE from_bank_account_id = ? OR to_bank_account_id = ?
            ORDER BY reference_date DESC
        `).all(accountId, accountId) as any[];

        return rows.map((row) => ({
            id: row.id,
            fromBankAccountId: row.from_bank_account_id,
            toBankAccountId: row.to_bank_account_id,
            amount: row.amount,
            referenceDate: new Date(row.reference_date),
        }));
    }
}
