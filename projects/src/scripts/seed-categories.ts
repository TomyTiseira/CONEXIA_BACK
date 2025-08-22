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
  // Categorías de Desarrollo (agrupando skills relacionadas)
  {
    name: 'Desarrollo Frontend',
    description:
      'Proyectos de desarrollo frontend, interfaces de usuario y aplicaciones web',
  },
  {
    name: 'Desarrollo Backend',
    description: 'Proyectos de desarrollo backend, APIs y servicios web',
  },
  {
    name: 'Desarrollo Mobile',
    description: 'Proyectos de desarrollo móvil nativo y multiplataforma',
  },
  {
    name: 'Desarrollo de Videojuegos',
    description:
      'Proyectos de desarrollo de videojuegos y aplicaciones interactivas',
  },
  {
    name: 'Desarrollo Blockchain',
    description: 'Proyectos de blockchain, contratos inteligentes y Web3',
  },
  {
    name: 'Desarrollo IoT y Embedded',
    description: 'Proyectos de Internet de las Cosas y sistemas embebidos',
  },

  // Categorías de Tecnologías Específicas
  {
    name: 'Inteligencia Artificial',
    description: 'Proyectos de IA, machine learning y procesamiento de datos',
  },
  {
    name: 'Ciencia de Datos',
    description:
      'Proyectos de análisis de datos, visualización y business intelligence',
  },
  {
    name: 'DevOps',
    description:
      'Proyectos de DevOps, cloud computing y gestión de infraestructura',
  },
  {
    name: 'Bases de Datos',
    description:
      'Proyectos de bases de datos, almacenamiento y procesamiento de datos',
  },
  {
    name: 'Seguridad Informática',
    description:
      'Proyectos de ciberseguridad, auditorías y protección de sistemas',
  },
  {
    name: 'Testing y QA',
    description:
      'Proyectos de testing automatizado, QA y aseguramiento de calidad',
  },

  // Categorías de Diseño (agrupando skills relacionadas)
  {
    name: 'Diseño UX/UI',
    description: 'Proyectos de diseño de experiencia de usuario e interfaces',
  },
  {
    name: 'Diseño Gráfico y Branding',
    description:
      'Proyectos de diseño gráfico, identidad de marca y comunicación visual',
  },
  {
    name: 'Diseño 3D y Motion',
    description: 'Proyectos de modelado 3D, animación y gráficos en movimiento',
  },
  {
    name: 'Diseño Industrial y Producto',
    description:
      'Proyectos de diseño industrial, arquitectónico y de productos',
  },

  // Categorías de Marketing (agrupando skills relacionadas)
  {
    name: 'Marketing Digital',
    description: 'Proyectos de marketing digital, SEO, SEM y publicidad online',
  },
  {
    name: 'Gestión de Redes Sociales',
    description:
      'Proyectos de gestión de redes sociales, community management y social media',
  },

  // Categorías de Medios y Comunicación
  {
    name: 'Fotografía y Edición',
    description:
      'Proyectos fotográficos, edición de imágenes y producción visual',
  },
  {
    name: 'Video y Animación',
    description: 'Proyectos de video, animación y producción multimedia',
  },
  {
    name: 'Audio y Podcasts',
    description: 'Proyectos de audio, podcasts y producción sonora',
  },

  // Categorías de Gestión y Metodologías
  {
    name: 'Gestión de Proyectos',
    description: 'Proyectos de gestión, metodologías ágiles y consultoría',
  },
  {
    name: 'Consultoría Tecnológica',
    description: 'Proyectos de consultoría, auditorías y asesoramiento técnico',
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
