import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVERS: string[];
  PORT: number;
  JWT_SECRET: string;
  CORS_ORIGINS?: string[];
  NODE_ENV: string;
  GCS_PROJECT_ID?: string;
  GCS_KEY_FILE?: string;
  GCS_MESSAGES_BUCKET?: string;
}

const envSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    PORT: joi.number().required(),
    JWT_SECRET: joi.string().required(),
    CORS_ORIGINS: joi.array().items(joi.string()).optional(),
    NODE_ENV: joi.string().default('development'),
    GCS_PROJECT_ID: joi.string().when('NODE_ENV', {
      is: 'production',
      then: joi.string().required(),
      otherwise: joi.string().optional(),
    }),
    GCS_KEY_FILE: joi.string().optional().allow(''),
    GCS_MESSAGES_BUCKET: joi.string().when('NODE_ENV', {
      is: 'production',
      then: joi.string().required(),
          GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
          GCS_KEY_FILE: process.env.GCS_KEY_FILE,
          GCS_MESSAGES_BUCKET: process.env.GCS_MESSAGES_BUCKET,
      otherwise: joi.string().optional(),
    }),
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
  gcs: {
    projectId: envVars.GCS_PROJECT_ID,
    keyFile: envVars.GCS_KEY_FILE,
    messagesBucket: envVars.GCS_MESSAGES_BUCKET,
  },
  jwtSecret: envVars.JWT_SECRET,
  corsOrigins: envVars.CORS_ORIGINS || [],
  nodeEnv: envVars.NODE_ENV,
};
