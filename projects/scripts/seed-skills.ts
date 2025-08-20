import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Rubro } from '../src/shared/entities/rubro.entity';
import { Skill } from '../src/shared/entities/skill.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'projects_db',
  entities: [Rubro, Skill],
  synchronize: false,
  logging: false,
});

const skillsByRubro = {
  Software: [
    // Lenguajes de Programación
    { name: 'JavaScript', description: 'Lenguaje de programación web' },
    { name: 'TypeScript', description: 'JavaScript con tipos estáticos' },
    { name: 'Python', description: 'Lenguaje de programación versátil' },
    {
      name: 'Java',
      description: 'Lenguaje de programación orientado a objetos',
    },
    { name: 'C#', description: 'Lenguaje de Microsoft para .NET' },
    { name: 'PHP', description: 'Lenguaje para desarrollo web' },
    { name: 'Ruby', description: 'Lenguaje de programación dinámico' },
    { name: 'Go', description: 'Lenguaje de Google para sistemas' },
    { name: 'Rust', description: 'Lenguaje de sistemas seguro' },
    { name: 'Swift', description: 'Lenguaje para desarrollo iOS' },
    { name: 'Kotlin', description: 'Lenguaje moderno para Android' },
    { name: 'Scala', description: 'Lenguaje funcional para JVM' },
    { name: 'Elixir', description: 'Lenguaje funcional para aplicaciones web' },
    { name: 'Clojure', description: 'Lenguaje Lisp para JVM' },
    { name: 'Haskell', description: 'Lenguaje funcional puro' },

    // Frameworks Frontend
    { name: 'React', description: 'Biblioteca para interfaces de usuario' },
    { name: 'Angular', description: 'Framework para aplicaciones web' },
    { name: 'Vue.js', description: 'Framework progresivo para JavaScript' },
    { name: 'Next.js', description: 'Framework de React para SSR' },
    { name: 'Nuxt.js', description: 'Framework de Vue para SSR' },
    { name: 'Svelte', description: 'Framework compilado para frontend' },
    { name: 'Ember.js', description: 'Framework para aplicaciones web' },
    { name: 'Backbone.js', description: 'Framework ligero para frontend' },

    // Frameworks Backend
    { name: 'Node.js', description: 'Runtime de JavaScript para backend' },
    { name: 'Express.js', description: 'Framework web para Node.js' },
    { name: 'NestJS', description: 'Framework progresivo para Node.js' },
    { name: 'Fastify', description: 'Framework web rápido para Node.js' },
    { name: 'Django', description: 'Framework web de Python' },
    { name: 'Flask', description: 'Microframework web de Python' },
    { name: 'FastAPI', description: 'Framework moderno de Python para APIs' },
    { name: 'Spring Boot', description: 'Framework de Java para aplicaciones' },
    { name: 'Laravel', description: 'Framework PHP elegante' },
    { name: 'Symfony', description: 'Framework PHP para aplicaciones web' },
    { name: 'Ruby on Rails', description: 'Framework web de Ruby' },
    { name: 'ASP.NET Core', description: 'Framework web de Microsoft' },

    // Bases de Datos
    { name: 'PostgreSQL', description: 'Base de datos relacional avanzada' },
    { name: 'MySQL', description: 'Sistema de gestión de bases de datos' },
    { name: 'MongoDB', description: 'Base de datos NoSQL' },
    { name: 'Redis', description: 'Base de datos en memoria' },
    { name: 'SQLite', description: 'Base de datos ligera' },
    { name: 'Oracle', description: 'Base de datos empresarial' },
    { name: 'SQL Server', description: 'Base de datos de Microsoft' },
    { name: 'Cassandra', description: 'Base de datos NoSQL distribuida' },
    { name: 'Neo4j', description: 'Base de datos de grafos' },
    { name: 'Elasticsearch', description: 'Motor de búsqueda y análisis' },

    // Cloud y DevOps
    { name: 'AWS', description: 'Servicios en la nube de Amazon' },
    { name: 'Azure', description: 'Plataforma en la nube de Microsoft' },
    { name: 'Google Cloud', description: 'Servicios en la nube de Google' },
    { name: 'Docker', description: 'Contenedores de aplicaciones' },
    { name: 'Kubernetes', description: 'Orquestación de contenedores' },
    { name: 'Terraform', description: 'Infraestructura como código' },
    { name: 'Ansible', description: 'Automatización de configuración' },
    { name: 'Jenkins', description: 'Integración continua' },
    { name: 'GitLab CI/CD', description: 'Integración y despliegue continuo' },
    { name: 'GitHub Actions', description: 'Acciones de GitHub' },
    { name: 'Helm', description: 'Gestor de paquetes para Kubernetes' },
    { name: 'Prometheus', description: 'Monitoreo y alertas' },
    { name: 'Grafana', description: 'Visualización de métricas' },

    // Gestión de Proyectos y Metodologías
    { name: 'Agile', description: 'Metodología de desarrollo ágil' },
    { name: 'Scrum', description: 'Framework ágil Scrum' },
    { name: 'Kanban', description: 'Metodología Kanban' },
    { name: 'Lean', description: 'Metodología Lean' },
    { name: 'XP', description: 'Programación extrema' },
    { name: 'Crystal', description: 'Metodología Crystal' },
    { name: 'FDD', description: 'Desarrollo dirigido por características' },
    { name: 'DSDM', description: 'Desarrollo de software dinámico' },
    { name: 'TDD', description: 'Desarrollo dirigido por pruebas' },
    { name: 'BDD', description: 'Desarrollo dirigido por comportamiento' },

    // Testing y QA
    { name: 'Jest', description: 'Framework de testing para JavaScript' },
    { name: 'Mocha', description: 'Framework de testing para Node.js' },
    { name: 'JUnit', description: 'Framework de testing para Java' },
    { name: 'PyTest', description: 'Framework de testing para Python' },
    { name: 'PHPUnit', description: 'Framework de testing para PHP' },
    { name: 'Selenium', description: 'Automatización de testing web' },
    {
      name: 'Cypress',
      description: 'Testing end-to-end para aplicaciones web',
    },
    { name: 'Playwright', description: 'Testing de navegadores' },
    { name: 'Appium', description: 'Testing de aplicaciones móviles' },
    { name: 'Postman', description: 'Testing de APIs' },
    { name: 'JMeter', description: 'Testing de rendimiento' },
    { name: 'LoadRunner', description: 'Testing de carga' },

    // Inteligencia Artificial y Machine Learning
    { name: 'TensorFlow', description: 'Framework de ML de Google' },
    { name: 'PyTorch', description: 'Framework de ML de Facebook' },
    { name: 'Scikit-learn', description: 'Biblioteca de ML para Python' },
    { name: 'Keras', description: 'API de alto nivel para redes neuronales' },
    { name: 'OpenCV', description: 'Visión computacional' },
    { name: 'NLTK', description: 'Procesamiento de lenguaje natural' },
    {
      name: 'SpaCy',
      description: 'Procesamiento de lenguaje natural industrial',
    },
    { name: 'Hugging Face', description: 'Transformers y modelos de IA' },
    { name: 'Pandas', description: 'Manipulación y análisis de datos' },
    { name: 'NumPy', description: 'Computación numérica en Python' },
    { name: 'Matplotlib', description: 'Visualización de datos en Python' },
    { name: 'Seaborn', description: 'Visualización estadística en Python' },

    // Ciencia de Datos
    { name: 'Data Analysis', description: 'Análisis de datos' },
    { name: 'Data Visualization', description: 'Visualización de datos' },
    { name: 'Statistical Analysis', description: 'Análisis estadístico' },
    { name: 'Predictive Modeling', description: 'Modelado predictivo' },
    { name: 'Data Mining', description: 'Minería de datos' },
    { name: 'ETL', description: 'Extracción, transformación y carga' },
    { name: 'Data Warehousing', description: 'Almacenamiento de datos' },
    { name: 'Business Intelligence', description: 'Inteligencia de negocio' },
    { name: 'Tableau', description: 'Visualización de datos' },
    { name: 'Power BI', description: 'Business Intelligence de Microsoft' },
    {
      name: 'Jupyter Notebooks',
      description: 'Entorno de desarrollo para datos',
    },
    { name: 'R', description: 'Lenguaje para estadística' },

    // Seguridad
    { name: 'OWASP', description: 'Open Web Application Security Project' },
    { name: 'Penetration Testing', description: 'Pruebas de penetración' },
    {
      name: 'Vulnerability Assessment',
      description: 'Evaluación de vulnerabilidades',
    },
    { name: 'Security Auditing', description: 'Auditorías de seguridad' },
    { name: 'Cryptography', description: 'Criptografía' },
    { name: 'Network Security', description: 'Seguridad de redes' },
    { name: 'Application Security', description: 'Seguridad de aplicaciones' },
    { name: 'Cloud Security', description: 'Seguridad en la nube' },
    { name: 'Incident Response', description: 'Respuesta a incidentes' },
    { name: 'Threat Intelligence', description: 'Inteligencia de amenazas' },

    // Herramientas de Desarrollo
    { name: 'Git', description: 'Control de versiones' },
    { name: 'GitHub', description: 'Plataforma de desarrollo colaborativo' },
    { name: 'GitLab', description: 'Plataforma de DevOps' },
    { name: 'Bitbucket', description: 'Plataforma de Git de Atlassian' },

    // APIs y Microservicios
    { name: 'REST API', description: 'APIs RESTful' },
    { name: 'GraphQL', description: 'Lenguaje de consulta para APIs' },
    { name: 'gRPC', description: 'Framework RPC de Google' },
    { name: 'Swagger', description: 'Documentación de APIs' },
    { name: 'Postman', description: 'Cliente para APIs' },
    { name: 'Insomnia', description: 'Cliente REST para APIs' },
    { name: 'Microservices', description: 'Arquitectura de microservicios' },
    { name: 'API Gateway', description: 'Puerta de enlace de API' },
    { name: 'Service Mesh', description: 'Malla de servicios' },
    {
      name: 'Event-Driven Architecture',
      description: 'Arquitectura dirigida por eventos',
    },

    // Mobile Development
    { name: 'React Native', description: 'Desarrollo móvil con React' },
    { name: 'Flutter', description: 'Framework de Google para apps móviles' },
    {
      name: 'Xamarin',
      description: 'Desarrollo móvil multiplataforma de Microsoft',
    },
    { name: 'Ionic', description: 'Framework para apps híbridas' },
    { name: 'Cordova', description: 'Framework para apps híbridas' },
    { name: 'PhoneGap', description: 'Framework para apps móviles' },
    {
      name: 'NativeScript',
      description: 'Desarrollo móvil nativo con JavaScript',
    },
    {
      name: 'Kotlin Multiplatform',
      description: 'Desarrollo multiplataforma con Kotlin',
    },

    // Blockchain
    { name: 'Solidity', description: 'Lenguaje para contratos inteligentes' },
    { name: 'Web3.js', description: 'Biblioteca para Ethereum' },
    { name: 'Hardhat', description: 'Entorno de desarrollo para Ethereum' },
    { name: 'Truffle', description: 'Framework para desarrollo blockchain' },
    { name: 'Ganache', description: 'Blockchain personal de Ethereum' },
    { name: 'MetaMask', description: 'Billetera de Ethereum' },

    // Game Development
    { name: 'Unity', description: 'Motor de juegos multiplataforma' },
    { name: 'Unreal Engine', description: 'Motor de juegos de Epic' },
    { name: 'Godot', description: 'Motor de juegos de código abierto' },
    { name: 'Cocos2d', description: 'Framework para desarrollo de juegos 2D' },
    { name: 'Phaser', description: 'Framework para juegos HTML5' },
    { name: 'Three.js', description: 'Biblioteca 3D para web' },

    // IoT y Embedded Systems
    { name: 'Arduino', description: 'Plataforma de desarrollo electrónico' },
    { name: 'Raspberry Pi', description: 'Computadora de placa única' },
    { name: 'ESP32', description: 'Microcontrolador WiFi y Bluetooth' },
    { name: 'MQTT', description: 'Protocolo de mensajería para IoT' },
    { name: 'CoAP', description: 'Protocolo de aplicación restringida' },
    { name: 'LoRaWAN', description: 'Protocolo de red de área amplia' },
  ],
  Diseño: [
    // Software de Diseño
    {
      name: 'Adobe Photoshop',
      description: 'Edición de imágenes y fotografía',
    },
    {
      name: 'Adobe Illustrator',
      description: 'Diseño vectorial e ilustraciones',
    },
    { name: 'Adobe InDesign', description: 'Maquetación y diseño editorial' },
    { name: 'Adobe XD', description: 'Diseño de interfaces y prototipado' },
    {
      name: 'Adobe After Effects',
      description: 'Efectos visuales y animación',
    },
    { name: 'Adobe Premiere Pro', description: 'Edición de video profesional' },
    { name: 'Figma', description: 'Diseño colaborativo de interfaces' },
    { name: 'Sketch', description: 'Diseño de interfaces para Mac' },
    { name: 'Canva', description: 'Diseño gráfico online' },
    { name: 'CorelDRAW', description: 'Diseño vectorial y gráfico' },
    { name: 'Affinity Designer', description: 'Alternativa a Illustrator' },
    { name: 'Affinity Photo', description: 'Alternativa a Photoshop' },
    { name: 'Affinity Publisher', description: 'Alternativa a InDesign' },
    { name: 'GIMP', description: 'Editor de imágenes gratuito' },
    { name: 'Inkscape', description: 'Editor vectorial gratuito' },
    { name: 'Blender', description: 'Software 3D gratuito' },

    // Diseño de Interfaces
    { name: 'UI Design', description: 'Diseño de interfaces de usuario' },
    { name: 'UX Design', description: 'Diseño de experiencia de usuario' },
    { name: 'User Research', description: 'Investigación de usuarios' },
    { name: 'User Personas', description: 'Personas de usuario' },
    { name: 'User Journey Mapping', description: 'Mapas de viaje del usuario' },
    { name: 'Wireframing', description: 'Creación de wireframes' },
    { name: 'Prototyping', description: 'Creación de prototipos' },
    { name: 'Usability Testing', description: 'Pruebas de usabilidad' },
    {
      name: 'Information Architecture',
      description: 'Arquitectura de información',
    },
    { name: 'Interaction Design', description: 'Diseño de interacciones' },
    { name: 'Visual Design', description: 'Diseño visual' },
    { name: 'Accessibility Design', description: 'Diseño accesible' },
    { name: 'Mobile Design', description: 'Diseño móvil' },
    { name: 'Web Design', description: 'Diseño web' },
    { name: 'Responsive Design', description: 'Diseño responsivo' },

    // Diseño Gráfico
    { name: 'Typography', description: 'Tipografía y diseño de texto' },
    { name: 'Color Theory', description: 'Teoría del color' },
    { name: 'Layout Design', description: 'Diseño de maquetas' },
    { name: 'Brand Identity', description: 'Identidad de marca' },
    { name: 'Logo Design', description: 'Diseño de logos' },
    { name: 'Print Design', description: 'Diseño para impresión' },
    { name: 'Digital Design', description: 'Diseño digital' },
    { name: 'Illustration', description: 'Ilustración digital' },
    { name: 'Icon Design', description: 'Diseño de iconos' },
    { name: 'Packaging Design', description: 'Diseño de empaques' },
    { name: 'Editorial Design', description: 'Diseño editorial' },
    { name: 'Poster Design', description: 'Diseño de carteles' },
    { name: 'Brochure Design', description: 'Diseño de folletos' },
    {
      name: 'Business Card Design',
      description: 'Diseño de tarjetas de presentación',
    },

    // Diseño 3D y Motion
    { name: '3D Modeling', description: 'Modelado 3D' },
    { name: '3D Animation', description: 'Animación 3D' },
    { name: 'Motion Graphics', description: 'Gráficos en movimiento' },
    { name: 'Character Design', description: 'Diseño de personajes' },
    { name: 'Environment Design', description: 'Diseño de entornos' },
    { name: 'Product Design', description: 'Diseño de productos' },
    { name: 'Industrial Design', description: 'Diseño industrial' },
    { name: 'Architectural Design', description: 'Diseño arquitectónico' },
    { name: 'Interior Design', description: 'Diseño de interiores' },
    { name: 'Landscape Design', description: 'Diseño de paisajes' },

    // Herramientas y Metodologías
    { name: 'Design Systems', description: 'Sistemas de diseño' },
    { name: 'Design Thinking', description: 'Pensamiento de diseño' },
    { name: 'Design Sprint', description: 'Sprint de diseño' },
    { name: 'Design Research', description: 'Investigación de diseño' },
    { name: 'Design Strategy', description: 'Estrategia de diseño' },
    { name: 'Design Management', description: 'Gestión de diseño' },
    { name: 'Design Collaboration', description: 'Colaboración en diseño' },
    { name: 'Design Critique', description: 'Crítica de diseño' },
    { name: 'Design Documentation', description: 'Documentación de diseño' },
    { name: 'Design Handoff', description: 'Entrega de diseño' },
  ],
  Marketing: [
    // Marketing Digital
    { name: 'SEO', description: 'Optimización para motores de búsqueda' },
    { name: 'SEM', description: 'Marketing en motores de búsqueda' },
    { name: 'Google Ads', description: 'Publicidad en Google' },
    { name: 'Facebook Ads', description: 'Publicidad en Facebook' },
    { name: 'Instagram Ads', description: 'Publicidad en Instagram' },
    { name: 'LinkedIn Ads', description: 'Publicidad en LinkedIn' },
    { name: 'Twitter Ads', description: 'Publicidad en Twitter' },
    { name: 'TikTok Ads', description: 'Publicidad en TikTok' },
    { name: 'YouTube Ads', description: 'Publicidad en YouTube' },
    { name: 'Pinterest Ads', description: 'Publicidad en Pinterest' },
    { name: 'Snapchat Ads', description: 'Publicidad en Snapchat' },
    { name: 'Reddit Ads', description: 'Publicidad en Reddit' },

    // Marketing de Contenido
    { name: 'Content Marketing', description: 'Marketing de contenidos' },
    { name: 'Blog Writing', description: 'Escritura de blogs' },
    { name: 'Copywriting', description: 'Redacción publicitaria' },
    {
      name: 'Email Marketing',
      description: 'Marketing por correo electrónico',
    },
    { name: 'Newsletter Marketing', description: 'Marketing por newsletters' },
    { name: 'Whitepaper Marketing', description: 'Marketing con whitepapers' },
    {
      name: 'Case Study Marketing',
      description: 'Marketing con casos de estudio',
    },
    { name: 'Infographic Marketing', description: 'Marketing con infografías' },
    { name: 'Video Marketing', description: 'Marketing con video' },
    { name: 'Podcast Marketing', description: 'Marketing con podcasts' },
    { name: 'Webinar Marketing', description: 'Marketing con webinars' },
    { name: 'E-book Marketing', description: 'Marketing con e-books' },

    // Redes Sociales
    {
      name: 'Social Media Marketing',
      description: 'Marketing en redes sociales',
    },
    {
      name: 'Social Media Strategy',
      description: 'Estrategia en redes sociales',
    },
    {
      name: 'Social Media Management',
      description: 'Gestión de redes sociales',
    },
    { name: 'Community Management', description: 'Gestión de comunidades' },
    { name: 'Influencer Marketing', description: 'Marketing con influencers' },
    {
      name: 'Social Media Advertising',
      description: 'Publicidad en redes sociales',
    },
    {
      name: 'Social Media Analytics',
      description: 'Análisis de redes sociales',
    },
    { name: 'Social Media Design', description: 'Diseño para redes sociales' },
    {
      name: 'Social Media Copywriting',
      description: 'Redacción para redes sociales',
    },
    {
      name: 'Social Media Calendar',
      description: 'Calendario de contenido social',
    },
    {
      name: 'Social Media Monitoring',
      description: 'Monitoreo de redes sociales',
    },
    {
      name: 'Social Media Crisis Management',
      description: 'Gestión de crisis en redes',
    },

    // Análisis y Métricas
    { name: 'Google Analytics', description: 'Análisis web de Google' },
    { name: 'Google Data Studio', description: 'Visualización de datos' },
    { name: 'Google Tag Manager', description: 'Gestión de etiquetas' },
    { name: 'Facebook Analytics', description: 'Análisis de Facebook' },
    { name: 'Twitter Analytics', description: 'Análisis de Twitter' },
    { name: 'LinkedIn Analytics', description: 'Análisis de LinkedIn' },
    { name: 'Instagram Insights', description: 'Insights de Instagram' },
    { name: 'TikTok Analytics', description: 'Análisis de TikTok' },
    { name: 'YouTube Analytics', description: 'Análisis de YouTube' },
    { name: 'Conversion Tracking', description: 'Seguimiento de conversiones' },
    { name: 'A/B Testing', description: 'Pruebas A/B' },
    { name: 'Multivariate Testing', description: 'Pruebas multivariadas' },

    // Herramientas de Marketing
    { name: 'HubSpot', description: 'Plataforma de marketing inbound' },
    { name: 'Mailchimp', description: 'Plataforma de email marketing' },
    { name: 'Constant Contact', description: 'Plataforma de email marketing' },
    { name: 'ConvertKit', description: 'Plataforma de email marketing' },
    {
      name: 'ActiveCampaign',
      description: 'Plataforma de marketing automation',
    },
    { name: 'Klaviyo', description: 'Plataforma de email marketing' },
    { name: 'Hootsuite', description: 'Gestión de redes sociales' },
    { name: 'Buffer', description: 'Programación de contenido social' },
    { name: 'Sprout Social', description: 'Gestión de redes sociales' },
    { name: 'Later', description: 'Programación de contenido social' },
    { name: 'Planoly', description: 'Planificación de contenido visual' },
    { name: 'Canva', description: 'Diseño gráfico para marketing' },
  ],

  Fotografía: [
    // Software de Fotografía
    { name: 'Adobe Lightroom', description: 'Edición y organización de fotos' },
    { name: 'Adobe Photoshop', description: 'Edición avanzada de fotografía' },
    { name: 'Capture One', description: 'Software profesional de fotografía' },
    { name: 'Luminar', description: 'Editor de fotos con IA' },
    { name: 'ON1 Photo RAW', description: 'Editor de fotos RAW' },
    {
      name: 'DxO PhotoLab',
      description: 'Editor de fotos con corrección óptica',
    },
    { name: 'Affinity Photo', description: 'Alternativa a Photoshop' },
    { name: 'GIMP', description: 'Editor de imágenes gratuito' },
    { name: 'Darktable', description: 'Editor de fotos RAW gratuito' },
    { name: 'RawTherapee', description: 'Editor de fotos RAW gratuito' },
    { name: 'Snapseed', description: 'Editor de fotos móvil' },
    { name: 'VSCO', description: 'Editor de fotos y comunidad' },

    // Tipos de Fotografía
    { name: 'Fotografía de Retrato', description: 'Fotografía de retratos' },
    { name: 'Fotografía de Paisaje', description: 'Fotografía de paisajes' },
    { name: 'Fotografía de Calle', description: 'Fotografía callejera' },
    { name: 'Fotografía de Producto', description: 'Fotografía de productos' },
    { name: 'Fotografía de Evento', description: 'Cobertura de eventos' },
    {
      name: 'Fotografía Arquitectónica',
      description: 'Fotografía de arquitectura',
    },
    { name: 'Fotografía Macro', description: 'Fotografía de cerca' },
    {
      name: 'Fotografía de Naturaleza',
      description: 'Fotografía de naturaleza',
    },
    {
      name: 'Fotografía de Vida Silvestre',
      description: 'Fotografía de animales salvajes',
    },
    { name: 'Fotografía de Aves', description: 'Fotografía de aves' },
    { name: 'Fotografía Submarina', description: 'Fotografía bajo el agua' },
    { name: 'Fotografía Aérea', description: 'Fotografía desde el aire' },

    // Estilos de Fotografía
    {
      name: 'Fotografía en Blanco y Negro',
      description: 'Fotografía monocromática',
    },
    {
      name: 'Fotografía HDR',
      description: 'Fotografía de alto rango dinámico',
    },
    {
      name: 'Fotografía de Larga Exposición',
      description: 'Fotografía con exposiciones largas',
    },
    {
      name: 'Fotografía de Alta Velocidad',
      description: 'Fotografía de acción rápida',
    },
    {
      name: 'Fotografía de Tiempo Lapse',
      description: 'Fotografía de secuencia temporal',
    },
    {
      name: 'Fotografía de Doble Exposición',
      description: 'Fotografía con doble exposición',
    },
    { name: 'Fotografía de Silueta', description: 'Fotografía de siluetas' },
    { name: 'Fotografía de Reflejos', description: 'Fotografía con reflejos' },
    { name: 'Fotografía de Sombras', description: 'Fotografía con sombras' },
    { name: 'Fotografía de Texturas', description: 'Fotografía de texturas' },
    { name: 'Fotografía de Patrones', description: 'Fotografía de patrones' },
    { name: 'Fotografía Abstracta', description: 'Fotografía abstracta' },

    // Edición y Post-Procesamiento
    { name: 'Edición de Fotos', description: 'Técnicas de post-procesamiento' },
  ],
};

async function seedSkills() {
  await AppDataSource.initialize();
  const rubroRepo = AppDataSource.getRepository(Rubro);
  const skillRepo = AppDataSource.getRepository(Skill);

  // Obtener todos los rubros
  const rubros = await rubroRepo.find();
  if (rubros.length === 0) {
    console.log('No se encontraron rubros. Ejecuta primero seed-rubros.ts');
    await AppDataSource.destroy();
    return;
  }

  let totalSkills = 0;

  // Crear skills para cada rubro
  for (const [rubroName, skills] of Object.entries(skillsByRubro)) {
    const rubro = rubros.find((r) => r.name === rubroName);
    if (!rubro) {
      console.log(`Rubro no encontrado: ${rubroName}`);
      continue;
    }

    console.log(`\nCreando skills para: ${rubroName}`);

    for (const skillData of skills) {
      const exists = await skillRepo.findOne({
        where: { name: skillData.name },
      });
      if (!exists) {
        const skill = skillRepo.create({
          ...skillData,
          rubroId: rubro.id,
        });
        await skillRepo.save(skill);
        console.log(`  ✓ Skill '${skill.name}' creado.`);
        totalSkills++;
      } else {
        console.log(`  ⏭️  Skill '${skillData.name}' ya existe.`);
      }
    }
  }

  console.log(`\nSe crearon ${totalSkills} skills exitosamente`);
  await AppDataSource.destroy();
}

seedSkills()
  .then(() => {
    console.log('Seed de skills finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de skills:', err);
    process.exit(1);
  });
