import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SkillRepository } from '../shared/repository/skill.repository';

async function seedSkills() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const skillRepo = app.get(SkillRepository);

  const skills = [
    { name: 'JavaScript', description: 'Lenguaje de programación web' },
    { name: 'TypeScript', description: 'Superset tipado de JavaScript' },
    {
      name: 'React',
      description: 'Biblioteca de JavaScript para interfaces de usuario',
    },
    { name: 'Node.js', description: 'Runtime de JavaScript para el servidor' },
    { name: 'Python', description: 'Lenguaje de programación de alto nivel' },
    {
      name: 'Java',
      description: 'Lenguaje de programación orientado a objetos',
    },
    { name: 'C#', description: 'Lenguaje de programación de Microsoft' },
    {
      name: 'PHP',
      description: 'Lenguaje de programación para desarrollo web',
    },
    { name: 'Ruby', description: 'Lenguaje de programación dinámico' },
    { name: 'Go', description: 'Lenguaje de programación de Google' },
    { name: 'Rust', description: 'Lenguaje de programación de sistemas' },
    { name: 'Swift', description: 'Lenguaje de programación para iOS' },
    { name: 'Kotlin', description: 'Lenguaje de programación para Android' },
    { name: 'Docker', description: 'Plataforma de contenedores' },
    { name: 'Kubernetes', description: 'Orquestador de contenedores' },
    { name: 'AWS', description: 'Servicios en la nube de Amazon' },
    { name: 'Azure', description: 'Servicios en la nube de Microsoft' },
    { name: 'Google Cloud', description: 'Servicios en la nube de Google' },
    { name: 'MongoDB', description: 'Base de datos NoSQL' },
    { name: 'PostgreSQL', description: 'Base de datos relacional' },
    { name: 'MySQL', description: 'Sistema de gestión de bases de datos' },
    { name: 'Redis', description: 'Base de datos en memoria' },
    { name: 'GraphQL', description: 'Lenguaje de consulta para APIs' },
    { name: 'REST API', description: 'Arquitectura de APIs' },
    { name: 'Git', description: 'Sistema de control de versiones' },
    { name: 'CI/CD', description: 'Integración y entrega continua' },
    { name: 'Agile', description: 'Metodología de desarrollo ágil' },
    { name: 'Scrum', description: 'Framework ágil' },
    { name: 'DevOps', description: 'Prácticas de desarrollo y operaciones' },
    { name: 'Machine Learning', description: 'Aprendizaje automático' },
    { name: 'Data Science', description: 'Ciencia de datos' },
    { name: 'UI/UX Design', description: 'Diseño de interfaces de usuario' },
    { name: 'HTML/CSS', description: 'Lenguajes de marcado y estilos' },
    { name: 'Vue.js', description: 'Framework progresivo de JavaScript' },
    { name: 'Angular', description: 'Framework de JavaScript de Google' },
    { name: 'Next.js', description: 'Framework de React' },
    { name: 'NestJS', description: 'Framework de Node.js' },
    { name: 'Express.js', description: 'Framework web para Node.js' },
    { name: 'Django', description: 'Framework web de Python' },
    { name: 'Flask', description: 'Microframework web de Python' },
    { name: 'Spring Boot', description: 'Framework de Java' },
    { name: 'Laravel', description: 'Framework PHP' },
    { name: 'Ruby on Rails', description: 'Framework web de Ruby' },
  ];

  console.log('🌱 Iniciando seed de habilidades...');

  for (const skillData of skills) {
    try {
      const existingSkill = await skillRepo.findByName(skillData.name);
      if (!existingSkill) {
        await skillRepo.createSkill(skillData.name, skillData.description);
        console.log(`✅ Habilidad creada: ${skillData.name}`);
      } else {
        console.log(`⏭️  Habilidad ya existe: ${skillData.name}`);
      }
    } catch (error) {
      console.error(
        `❌ Error al crear habilidad ${skillData.name}:`,
        error.message,
      );
    }
  }

  console.log('🎉 Seed de habilidades completado!');
  await app.close();
}

seedSkills().catch(console.error);
