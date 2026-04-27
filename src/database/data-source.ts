import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // entities: ['src/**/*.entity.ts'],
  // migrations: ['src/migrations/*.ts'],
entities: [
  process.env.NODE_ENV === 'production'
    ? 'dist/**/*.entity.js'
    : 'src/**/*.entity.ts'
],
migrations: [
  process.env.NODE_ENV === 'production'
    ? 'dist/migrations/*.js'
    : 'src/migrations/*.ts'
],
  synchronize: false,
});