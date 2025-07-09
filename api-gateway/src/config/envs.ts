import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVERS: string[];
  PORT: number;
  JWT_SECRET: string;
}

const envSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    PORT: joi.number().required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown(true);

const result = envSchema.validate({
  NATS_SERVERS: process.env.NATS_SERVERS?.split(',') || [],
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET,
});
if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value as EnvVars;

export const envs = {
  natsServers: envVars.NATS_SERVERS,
  port: envVars.PORT,
  jwtSecret: envVars.JWT_SECRET,
};
