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
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_BACK_URL?: string;
  MERCADOPAGO_NOTIFICATION_URL?: string;
  MERCADOPAGO_CURRENCY_ID?: string;
}

const envSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    DATABASE_URL: joi.string().optional(),
    DB_HOST: joi.string().default('localhost'),
    DB_PORT: joi.string().default('5432'),
    DB_USERNAME: joi.string().default('postgres'),
    DB_PASSWORD: joi.string().default('postgres'),
    DB_DATABASE: joi.string().default('membership_db'),
    MERCADOPAGO_ACCESS_TOKEN: joi.string().optional(),
    MERCADOPAGO_BACK_URL: joi.string().default('http://localhost:3000'),
    MERCADOPAGO_NOTIFICATION_URL: joi.string().optional(),
    MERCADOPAGO_CURRENCY_ID: joi.string().default('ARS'),
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
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_BACK_URL: process.env.MERCADOPAGO_BACK_URL,
  MERCADOPAGO_NOTIFICATION_URL: process.env.MERCADOPAGO_NOTIFICATION_URL,
  MERCADOPAGO_CURRENCY_ID: process.env.MERCADOPAGO_CURRENCY_ID,
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
  mercadoPagoAccessToken: envVars.MERCADOPAGO_ACCESS_TOKEN || '',
  mercadoPagoBackUrl: envVars.MERCADOPAGO_BACK_URL || 'http://localhost:3000',
  mercadoPagoNotificationUrl: envVars.MERCADOPAGO_NOTIFICATION_URL || '',
  mercadoPagoCurrencyId: envVars.MERCADOPAGO_CURRENCY_ID || 'ARS',
};
