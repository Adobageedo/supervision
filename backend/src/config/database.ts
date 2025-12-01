import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/User';
import { Intervention } from '../entities/Intervention';
import { Intervenant } from '../entities/Intervenant';
import { PredefinedValue } from '../entities/PredefinedValue';
import { AuditLog } from '../entities/AuditLog';
import { Company } from '../entities/Company';

dotenv.config();

const dbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'supervision_user',
  password: process.env.DB_PASSWORD || 'supervision_password',
  database: process.env.DB_NAME || 'supervision_maintenance',
  synchronize: false, // Disabled - use migrations instead
  logging: process.env.NODE_ENV === 'development',
};

// Safe logging (do not print raw password)
console.log('🔍 [Database Config]', {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password ? '***' : undefined,
  database: dbConfig.database,
  NODE_ENV: process.env.NODE_ENV,
});

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  ...dbConfig,
  entities: [User, Intervention, Intervenant, PredefinedValue, AuditLog, Company],
  migrations: isProduction
    ? ['dist/database/migrations/**/*.js', 'dist/migrations/**/*.js']
    : ['src/database/migrations/**/*.ts', 'src/migrations/**/*.ts'],
  subscribers: [],
});
