import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVERS: string[];
  DATABASE_URL?: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SECURE: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  ALGORITHM: string;
}

const envSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    DATABASE_URL: joi.string().optional(),
    DB_HOST: joi.string().default('localhost'),
    DB_PORT: joi.string().default('5432'),
    DB_USERNAME: joi.string().default('postgres'),
    DB_PASSWORD: joi.string().default('postgres'),
    DB_DATABASE: joi.string().default('users_db'),
    SMTP_HOST: joi.string().required(),
    SMTP_PORT: joi.string().required(),
    SMTP_SECURE: joi.string().required(),
    SMTP_USER: joi.string().required(),
    SMTP_PASS: joi.string().required(),
    EMAIL_FROM: joi.string().default('noreply@conexia.com'),
    JWT_SECRET: joi.string().required(),
    ENCRYPTION_KEY: joi.string().required(),
    ALGORITHM: joi.string().required(),
  })
  .unknown(true);

const result = envSchema.validate({
  NATS_SERVERS: process.env.NATS_SERVERS?.split(',') || [],
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  ALGORITHM: process.env.ALGORITHM,
});
if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value as EnvVars;

export const envs = {
  natsServers: envVars.NATS_SERVERS,
  databaseUrl: envVars.DATABASE_URL,
  dbHost: envVars.DB_HOST,
  dbPort: envVars.DB_PORT,
  dbUsername: envVars.DB_USERNAME,
  dbPassword: envVars.DB_PASSWORD,
  dbDatabase: envVars.DB_DATABASE,
  smtpHost: envVars.SMTP_HOST,
  smtpPort: envVars.SMTP_PORT,
  smtpSecure: envVars.SMTP_SECURE,
  smtpUser: envVars.SMTP_USER,
  smtpPass: envVars.SMTP_PASS,
  emailFrom: envVars.EMAIL_FROM,
  jwtSecret: envVars.JWT_SECRET,
  encryptionKey: envVars.ENCRYPTION_KEY,
  algorithm: envVars.ALGORITHM,
};
