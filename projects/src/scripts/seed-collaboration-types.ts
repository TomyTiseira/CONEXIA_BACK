import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CollaborationType } from '../projects/entities/collaboration-type.entity';

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
        database: process.env.DB_DATABASE || 'projects_db',
      }),
  entities: [CollaborationType],
  synchronize: false,
  logging: false,
});

const collaborationTypes = [
  { name: 'Remunerado', description: 'Colaboración remunerada' },
  { name: 'Voluntario', description: 'Colaboración voluntaria' },
  { name: 'A Definir', description: 'Colaboración a definir' },
  { name: 'Freelance', description: 'Trabajo independiente por proyecto' },
];

async function seedCollaborationTypes() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(CollaborationType);

  for (const collaborationType of collaborationTypes) {
    const exists = await repo.findOne({
      where: { name: collaborationType.name },
    });
    if (!exists) {
      await repo.save(collaborationType);
      console.log(`Tipo de colaboración '${collaborationType.name}' creado.`);
    } else {
      console.log(
        `Tipo de colaboración '${collaborationType.name}' ya existe.`,
      );
    }
  }

  await AppDataSource.destroy();
}

seedCollaborationTypes()
  .then(() => {
    console.log('Seed de tipos de colaboración finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de tipos de colaboración:', err);
    process.exit(1);
  });
