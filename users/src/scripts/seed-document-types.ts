import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { DocumentType } from '../shared/entities/document-type.entity';
import { DOCUMENT_TYPES_LIST } from '../users/constants/document-types';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'users',
      }),
  entities: [DocumentType],
  synchronize: false,
});

async function seedDocumentTypes() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(DocumentType);

  for (const docType of DOCUMENT_TYPES_LIST) {
    const exists = await repo.findOne({ where: { name: docType.name } });
    if (!exists) {
      await repo.save(docType);
      console.log(`Tipo de documento '${docType.name}' creado.`);
    } else {
      console.log(`Tipo de documento '${docType.name}' ya existe.`);
    }
  }

  await AppDataSource.destroy();
}

seedDocumentTypes()
  .then(() => {
    console.log('Seed de tipos de documento finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de tipos de documento:', err);
    process.exit(1);
  });
