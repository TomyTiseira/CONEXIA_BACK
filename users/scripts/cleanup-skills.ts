import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProfileSkillRepository } from '../src/shared/repository/profile-skill.repository';

async function cleanupSkills() {
  console.log(
    '🧹 Iniciando limpieza de relaciones profile-skill del microservicio de usuarios...',
  );

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const profileSkillRepository = app.get(ProfileSkillRepository);

    console.log('📊 Obteniendo estadísticas antes de la limpieza...');

    // Contar relaciones profile-skill existentes
    const profileSkillsCount = await profileSkillRepository.count();

    console.log(
      `📈 Relaciones profile-skill existentes: ${profileSkillsCount}`,
    );

    if (profileSkillsCount === 0) {
      console.log('ℹ️ No hay relaciones profile-skill para limpiar');
      return;
    }

    console.log('🗑️ Procediendo con la limpieza...');

    // Eliminar las relaciones profile-skill
    console.log('🗑️ Eliminando relaciones profile-skill...');
    await profileSkillRepository.clear();
    console.log(`✅ Eliminadas ${profileSkillsCount} relaciones profile-skill`);

    // Verificar que se hayan eliminado
    const finalProfileSkillsCount = await profileSkillRepository.count();

    console.log('\n📋 Resumen de la limpieza:');
    console.log(
      `🗑️ Relaciones profile-skill eliminadas: ${profileSkillsCount}`,
    );
    console.log(
      `📊 Relaciones profile-skill restantes: ${finalProfileSkillsCount}`,
    );

    if (finalProfileSkillsCount === 0) {
      console.log('✅ Limpieza completada exitosamente');
    } else {
      console.log('⚠️ Algunos datos no se eliminaron completamente');
    }
  } catch (error) {
    console.error('💥 Error durante la limpieza:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar la limpieza
cleanupSkills()
  .then(() => {
    console.log('🎉 Proceso de limpieza completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal durante la limpieza:', error);
    process.exit(1);
  });
