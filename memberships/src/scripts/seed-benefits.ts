import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Benefit } from '../membreships/entities/benefit.entity';

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
        database: process.env.DB_DATABASE || 'membership_db',
      }),
  entities: [Benefit],
  synchronize: false,
});

const benefits = [
  {
    key: 'public_profile',
    name: 'Perfil público profesional',
    description: 'Foto, bio, skills y links visibles en perfil',
    type: 'boolean' as const,
    options: null,
    active: true,
  },
  {
    key: 'publish_services',
    name: 'Publicar servicios digitales',
    description: 'Cantidad máxima de servicios digitales publicados',
    type: 'number' as const,
    options: null,
    active: true,
  },
  {
    key: 'publish_projects',
    name: 'Publicar proyectos colaborativos',
    description: 'Cantidad máxima de proyectos colaborativos publicados',
    type: 'number' as const,
    options: null,
    active: true,
  },
  {
    key: 'internal_chat',
    name: 'Chat interno con otros usuarios',
    description: 'Habilita el chat interno con otros usuarios',
    type: 'boolean' as const,
    options: null,
    active: true,
  },
  {
    key: 'community_reactions',
    name: 'Reacciones y comentarios en comunidad',
    description: 'Permite reaccionar y comentar en publicaciones de comunidad',
    type: 'boolean' as const,
    options: null,
    active: true,
  },
  {
    key: 'search_visibility',
    name: 'Visibilidad en búsquedas',
    description: 'Nivel de visibilidad en resultados de búsqueda',
    type: 'enum' as const,
    options: { values: ['estandar', 'alta', 'prioridad_maxima'] },
    active: true,
  },
  {
    key: 'highlight_services',
    name: 'Destacar servicios (etiqueta "Destacado")',
    description: 'Cantidad de servicios que se pueden destacar',
    type: 'number' as const,
    options: null,
    active: true,
  },
  {
    key: 'metrics_access',
    name: 'Acceso a métricas de perfil y servicios',
    description: 'Nivel de acceso a métricas',
    type: 'enum' as const,
    options: { values: ['basicas', 'detalladas', 'avanzadas'] },
    active: true,
  },
  {
    key: 'early_access',
    name: 'Acceso anticipado a nuevos features / beta',
    description: 'Acceso temprano a nuevas funcionalidades',
    type: 'boolean' as const,
    options: null,
    active: true,
  },
  {
    key: 'verified_reviews',
    name: 'Sistema de reseñas verificadas',
    description: 'Acceso a reseñas verificadas',
    type: 'boolean' as const,
    options: null,
    active: true,
  },
];

async function seedBenefits() {
  console.log('🔄 Inicializando conexión a base de datos...');

  await AppDataSource.initialize();
  console.log('✅ Conexión a base de datos establecida');

  const repo = AppDataSource.getRepository(Benefit);
  console.log('✅ Repository obtenido');

  for (const benefit of benefits) {
    const exists = await repo.findOne({ where: { key: benefit.key } });
    if (!exists) {
      await repo.save(benefit);
      console.log(`✅ Benefit '${benefit.key}' creado.`);
    } else {
      console.log(`⏭️  Benefit '${benefit.key}' ya existe.`);
    }
  }

  console.log('🔄 Cerrando conexión...');
  await AppDataSource.destroy();
  console.log('✅ Conexión cerrada');
}

seedBenefits()
  .then(() => {
    console.log('🎉 Seed de benefits finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Error en el seed de benefits:', err);
    process.exit(1);
  });
