import { injectable } from 'inversify';
import { CustomerRepository } from '@domain/repositories/customer-repository';
import { Customer } from '@domain/entities/customer';
import { CustomerNotFound } from '@domain/errors/customer-not-found';
import { getDatabase } from '../sqlite';

@injectable()
export class SQLiteCustomerRepository implements CustomerRepository {
    async getById(id: string): Promise<Customer> {
        const db = getDatabase();
        const customer = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(parseInt(id));

        if (!customer) {
            throw new CustomerNotFound(`Customer with id ${id} not found`);
        }

        return {
            id: customer.id.toString(),
            name: customer.name,
        };
    }
}
