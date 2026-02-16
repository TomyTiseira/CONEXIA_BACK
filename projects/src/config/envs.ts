import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NODE_ENV: string;
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
  FRONTEND_URL: string;
  GCS_PROJECT_ID?: string;
  GCS_KEY_FILE?: string;
  GCS_PROJECT_FILES_BUCKET?: string;
  GCS_CV_DOCUMENTS_BUCKET?: string;
}

const envSchema = joi
  .object({
    NODE_ENV: joi.string().default('development'),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    DATABASE_URL: joi.string().optional(),
    DB_HOST: joi.string().default('localhost'),
    DB_PORT: joi.string().default('5432'),
    DB_USERNAME: joi.string().default('postgres'),
    DB_PASSWORD: joi.string().default('postgres'),
    DB_DATABASE: joi.string().default('projects_db'),
    SMTP_HOST: joi.string().required(),
    SMTP_PORT: joi.string().required(),
    SMTP_SECURE: joi.string().required(),
    SMTP_USER: joi.string().required(),
    SMTP_PASS: joi.string().required(),
    EMAIL_FROM: joi.string().default('noreply@conexia.com'),
    FRONTEND_URL: joi.string().required(),
    GCS_PROJECT_ID: joi.string().when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional(),
    }),
    GCS_KEY_FILE: joi.string().when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional(),
    }),
    GCS_PROJECT_FILES_BUCKET: joi.string().when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional(),
    }),
    GCS_CV_DOCUMENTS_BUCKET: joi.string().when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional(),
    }),
  })
  .unknown(true);

const result = envSchema.validate({
  NODE_ENV: process.env.NODE_ENV,
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
  FRONTEND_URL: process.env.FRONTEND_URL,
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
  GCS_KEY_FILE: process.env.GCS_KEY_FILE,
  GCS_PROJECT_FILES_BUCKET: process.env.GCS_PROJECT_FILES_BUCKET,
  GCS_CV_DOCUMENTS_BUCKET: process.env.GCS_CV_DOCUMENTS_BUCKET,
});
if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value as EnvVars;

export const envs = {
  nodeEnv: envVars.NODE_ENV,
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
  frontendUrl: envVars.FRONTEND_URL,
  gcs: {
    projectId: envVars.GCS_PROJECT_ID || '',
    keyFile: envVars.GCS_KEY_FILE || '',
    projectFilesBucket: envVars.GCS_PROJECT_FILES_BUCKET || '',
    cvDocumentsBucket: envVars.GCS_CV_DOCUMENTS_BUCKET || '',
  },
};
