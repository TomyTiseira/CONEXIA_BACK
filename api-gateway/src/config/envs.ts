import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVERS: string[];
  PORT: number;
  JWT_SECRET: string;
  CORS_ORIGINS?: string[];
  NODE_ENV: string;
}

const envSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    PORT: joi.number().required(),
    JWT_SECRET: joi.string().required(),
    CORS_ORIGINS: joi.array().items(joi.string()).optional(),
    NODE_ENV: joi.string().default('development'),
  })
  .unknown(true);

const result = envSchema.validate({
  NATS_SERVERS: process.env.NATS_SERVERS?.split(',') || [],
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [],
  NODE_ENV: process.env.NODE_ENV,
});
if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value as EnvVars;

export const envs = {
  natsServers: envVars.NATS_SERVERS,
  port: envVars.PORT,
  jwtSecret: envVars.JWT_SECRET,
  corsOrigins: envVars.CORS_ORIGINS || [],
  nodeEnv: envVars.NODE_ENV,
};
