import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql as drizzleSql } from 'drizzle-orm';
import * as schema from './schema/index';

export const createDbHttp = (url: string) => {
    const sql = neon(url);
    return drizzle(sql, { schema });
};

export const createDbNextjs = (url: string) => {
    const sql = neon(url);
    return drizzle(sql, { schema });
};

const defaultUrl = process.env.DATABASE_URL;
export const db = defaultUrl ? createDbNextjs(defaultUrl) : null as any;

export const testDbConnection = async (database = db) => {
    try {
        await database.execute(drizzleSql`SELECT 1`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
