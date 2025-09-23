import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { ServiceCategory } from '../services/entities/category.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'services_db',
  entities: [ServiceCategory],
  synchronize: false,
  logging: false,
});

const serviceCategories = [
  // Categorías específicas para servicios digitales
  {
    name: 'Marketing y Publicidad Digital',
    description:
      'Servicios de marketing digital, SEO, SEM, publicidad online y estrategias de marca',
  },
  {
    name: 'Desarrollo y Programación',
    description:
      'Servicios de desarrollo web, móvil, software, APIs y soluciones tecnológicas',
  },
  {
    name: 'Diseño y Creatividad',
    description:
      'Servicios de diseño gráfico, UX/UI, branding, ilustración y creatividad visual',
  },
  {
    name: 'Escritura y Traducción',
    description:
      'Servicios de redacción, copywriting, traducción y contenido digital',
  },
  {
    name: 'Soporte Técnico',
    description:
      'Servicios de soporte técnico, mantenimiento, consultoría y resolución de problemas',
  },
  {
    name: 'Multimedia',
    description:
      'Servicios de fotografía, video, audio, animación y producción multimedia',
  },

  // Categorías adicionales basadas en proyectos
  {
    name: 'Desarrollo Frontend',
    description:
      'Servicios de desarrollo frontend, interfaces de usuario y aplicaciones web',
  },
  {
    name: 'Desarrollo Backend',
    description: 'Servicios de desarrollo backend, APIs y servicios web',
  },
  {
    name: 'Desarrollo Mobile',
    description: 'Servicios de desarrollo móvil nativo y multiplataforma',
  },
  {
    name: 'Desarrollo de Videojuegos',
    description:
      'Servicios de desarrollo de videojuegos y aplicaciones interactivas',
  },
  {
    name: 'Desarrollo Blockchain',
    description: 'Servicios de blockchain, contratos inteligentes y Web3',
  },
  {
    name: 'Desarrollo IoT y Embedded',
    description: 'Servicios de Internet de las Cosas y sistemas embebidos',
  },
  {
    name: 'Inteligencia Artificial',
    description: 'Servicios de IA, machine learning y procesamiento de datos',
  },
  {
    name: 'Ciencia de Datos',
    description:
      'Servicios de análisis de datos, visualización y business intelligence',
  },
  {
    name: 'DevOps',
    description:
      'Servicios de DevOps, cloud computing y gestión de infraestructura',
  },
  {
    name: 'Bases de Datos',
    description:
      'Servicios de bases de datos, almacenamiento y procesamiento de datos',
  },
  {
    name: 'Seguridad Informática',
    description:
      'Servicios de ciberseguridad, auditorías y protección de sistemas',
  },
  {
    name: 'Testing y QA',
    description:
      'Servicios de testing automatizado, QA y aseguramiento de calidad',
  },
  {
    name: 'Diseño UX/UI',
    description: 'Servicios de diseño de experiencia de usuario e interfaces',
  },
  {
    name: 'Diseño Gráfico y Branding',
    description:
      'Servicios de diseño gráfico, identidad de marca y comunicación visual',
  },
  {
    name: 'Diseño 3D y Motion',
    description: 'Servicios de modelado 3D, animación y gráficos en movimiento',
  },
  {
    name: 'Diseño Industrial y Producto',
    description:
      'Servicios de diseño industrial, arquitectónico y de productos',
  },
  {
    name: 'Gestión de Redes Sociales',
    description:
      'Servicios de gestión de redes sociales, community management y social media',
  },
  {
    name: 'Fotografía y Edición',
    description:
      'Servicios fotográficos, edición de imágenes y producción visual',
  },
  {
    name: 'Video y Animación',
    description: 'Servicios de video, animación y producción multimedia',
  },
  {
    name: 'Audio y Podcasts',
    description: 'Servicios de audio, podcasts y producción sonora',
  },
  {
    name: 'Gestión de Proyectos',
    description: 'Servicios de gestión, metodologías ágiles y consultoría',
  },
  {
    name: 'Consultoría Tecnológica',
    description: 'Servicios de consultoría, auditorías y asesoramiento técnico',
  },
];

async function seedServiceCategories() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ServiceCategory);

  for (const category of serviceCategories) {
    const exists = await repo.findOne({ where: { name: category.name } });
    if (!exists) {
      await repo.save(category);
      console.log(`Categoría de servicio '${category.name}' creada.`);
    } else {
      console.log(`Categoría de servicio '${category.name}' ya existe.`);
    }
  }

  await AppDataSource.destroy();
}

seedServiceCategories()
  .then(() => {
    console.log('Seed de categorías de servicios finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de categorías de servicios:', err);
    process.exit(1);
  });
