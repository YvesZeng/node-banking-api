import { getDatabase } from './sqlite';

export const connectDb = async () => {
    const db = getDatabase();
    return db;
};
