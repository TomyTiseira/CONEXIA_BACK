import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Role } from '../shared/entities/role.entity';
import { ROLES } from '../users/constants';

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
  entities: [Role],
  synchronize: false,
});

const roles = [
  { id: 1, name: ROLES.ADMIN, description: 'Administrador del sistema' },
  { id: 2, name: ROLES.USER, description: 'Usuario regular' },
  { id: 3, name: ROLES.MODERATOR, description: 'Moderador del sistema' },
];

async function seedRoles() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Role);

  for (const role of roles) {
    const exists = await repo.findOne({ where: { name: role.name } });
    if (!exists) {
      await repo.save(role);
      console.log(`Rol '${role.name}' creado.`);
    } else {
      console.log(`Rol '${role.name}' ya existe.`);
    }
  }

  await AppDataSource.destroy();
}

seedRoles()
  .then(() => {
    console.log('Seed de roles finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de roles:', err);
    process.exit(1);
  });
