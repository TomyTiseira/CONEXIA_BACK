import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BenefitRepository } from '../src/membreships/repository/benefit.repository';

async function seedBenefits() {
  console.log('🌱 Seeding initial benefits for memberships...');
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const benefitsRepo = app.get(BenefitRepository);

    const benefits = [
      {
        key: 'public_profile',
        name: 'Perfil público profesional',
        description: 'Foto, bio, skills y links visibles en perfil',
        type: 'boolean',
        options: null,
        active: true,
      },
      {
        key: 'publish_services',
        name: 'Publicar servicios digitales',
        description: 'Cantidad máxima de servicios digitales publicados',
        type: 'number',
        options: null,
        active: true,
      },
      {
        key: 'publish_projects',
        name: 'Publicar proyectos colaborativos',
        description: 'Cantidad máxima de proyectos colaborativos publicados',
        type: 'number',
        options: null,
        active: true,
      },
      {
        key: 'internal_chat',
        name: 'Chat interno con otros usuarios',
        description: 'Habilita el chat interno con otros usuarios',
        type: 'boolean',
        options: null,
        active: true,
      },
      {
        key: 'community_reactions',
        name: 'Reacciones y comentarios en comunidad',
        description:
          'Permite reaccionar y comentar en publicaciones de comunidad',
        type: 'boolean',
        options: null,
        active: true,
      },
      {
        key: 'search_visibility',
        name: 'Visibilidad en búsquedas',
        description: 'Nivel de visibilidad en resultados de búsqueda',
        type: 'enum',
        options: { values: ['estandar', 'alta', 'prioridad_maxima'] },
        active: true,
      },
      {
        key: 'highlight_services',
        name: 'Destacar servicios (etiqueta “Destacado”)',
        description: 'Cantidad de servicios que se pueden destacar',
        type: 'number',
        options: null,
        active: true,
      },
      {
        key: 'metrics_access',
        name: 'Acceso a métricas de perfil y servicios',
        description: 'Nivel de acceso a métricas',
        type: 'enum',
        options: { values: ['basicas', 'detalladas', 'avanzadas'] },
        active: true,
      },
      {
        key: 'early_access',
        name: 'Acceso anticipado a nuevos features / beta',
        description: 'Acceso temprano a nuevas funcionalidades',
        type: 'boolean',
        options: null,
        active: true,
      },
      {
        key: 'verified_reviews',
        name: 'Sistema de reseñas verificadas',
        description: 'Acceso a reseñas verificadas',
        type: 'boolean',
        options: null,
        active: true,
      },
    ] as const;

    for (const b of benefits) {
      await benefitsRepo.upsertByKey(b.key, {
        name: b.name,
        description: b.description,
        type: b.type as any,
        options: b.options,
        active: b.active,
      });

      console.log(`✅ Benefit ensured: ${b.key}`);
    }

    console.log('🎉 Benefits seeding completed');
  } catch (e) {
    console.error('💥 Error while seeding benefits', e);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

seedBenefits();
