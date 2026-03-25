import { getDatabase } from './sqlite';

export const connectDb = () => {
    const db = getDatabase();
    return db;
};
