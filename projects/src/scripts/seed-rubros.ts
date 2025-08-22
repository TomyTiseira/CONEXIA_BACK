import * as dotenv from 'dotenv';
import { Rubro } from 'src/shared/entities/rubro.entity';
import { DataSource } from 'typeorm';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'projects_db',
  entities: [Rubro],
  synchronize: false,
  logging: false,
});

const rubros = [
  { name: 'Software', description: 'Desarrollo de software y programación' },
  { name: 'Diseño', description: 'Diseño gráfico, UX/UI y branding' },
  { name: 'Marketing', description: 'Marketing digital y estrategias online' },
  { name: 'Fotografía', description: 'Fotografía comercial y artística' },
];

async function seedRubros() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Rubro);

  for (const rubro of rubros) {
    const exists = await repo.findOne({ where: { name: rubro.name } });
    if (!exists) {
      await repo.save(rubro);
      console.log(`Rubro '${rubro.name}' creado.`);
    } else {
      console.log(`Rubro '${rubro.name}' ya existe.`);
    }
  }

  await AppDataSource.destroy();
}

seedRubros()
  .then(() => {
    console.log('Seed de rubros finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de rubros:', err);
    process.exit(1);
  });
