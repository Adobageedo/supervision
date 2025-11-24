import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/User';
import { Intervention } from '../entities/Intervention';
import { Intervenant } from '../entities/Intervenant';
import { PredefinedValue } from '../entities/PredefinedValue';
import { AuditLog } from '../entities/AuditLog';

dotenv.config();

const dbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '4201', 10),
  username: process.env.DB_USER || 'supervision_user',
  password: process.env.DB_PASSWORD || 'supervision_password',
  database: process.env.DB_NAME || 'supervision_maintenance',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};

console.log('🔍 [Database Config]', {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  database: dbConfig.database,
  NODE_ENV: process.env.NODE_ENV,
});

export const AppDataSource = new DataSource({
  ...dbConfig,
  entities: [User, Intervention, Intervenant, PredefinedValue, AuditLog],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
