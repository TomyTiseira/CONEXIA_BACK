import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from '../projects/entities/category.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'projects_db',
  entities: [Category],
  synchronize: false,
  logging: false,
});

const categories = [
  { name: 'Desarrollo Web', description: 'Proyectos de desarrollo web' },
  { name: 'Desarrollo Móvil', description: 'Proyectos de desarrollo móvil' },
  { name: 'Inteligencia Artificial', description: 'Proyectos de IA y ML' },
  { name: 'DevOps', description: 'Proyectos de DevOps e infraestructura' },
  {
    name: 'Diseño UX/UI',
    description: 'Proyectos de diseño de experiencia de usuario',
  },
  {
    name: 'Análisis de Datos',
    description: 'Proyectos de análisis y visualización de datos',
  },
];

async function seedCategories() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Category);

  for (const category of categories) {
    const exists = await repo.findOne({ where: { name: category.name } });
    if (!exists) {
      await repo.save(category);
      console.log(`Categoría '${category.name}' creada.`);
    } else {
      console.log(`Categoría '${category.name}' ya existe.`);
    }
  }

  await AppDataSource.destroy();
}

seedCategories()
  .then(() => {
    console.log('Seed de categorías finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de categorías:', err);
    process.exit(1);
  });
