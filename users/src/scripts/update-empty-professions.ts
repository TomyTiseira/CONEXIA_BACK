/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function updateEmptyProfessions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔧 Iniciando actualización de profesiones vacías...');

  try {
    // Buscar perfiles que no tengan profesión (null, vacío o solo espacios)
    const profilesWithoutProfession = await dataSource.query(`
      SELECT id, profession 
      FROM profiles 
      WHERE profession IS NULL 
         OR profession = '' 
         OR TRIM(profession) = ''
    `);

    if (profilesWithoutProfession.length > 0) {
      console.log(
        `📝 Encontrados ${profilesWithoutProfession.length} perfiles sin profesión:`,
      );

      for (const profile of profilesWithoutProfession) {
        console.log(`  - Perfil ID ${profile.id}: "${profile.profession}"`);
      }

      // Actualizar todos los perfiles sin profesión
      await dataSource.query(`
        UPDATE profiles 
        SET profession = 'A Definir' 
        WHERE profession IS NULL 
           OR profession = '' 
           OR TRIM(profession) = ''
      `);

      console.log(
        `✅ "A Definir" asignado a ${profilesWithoutProfession.length} perfiles`,
      );
    } else {
      console.log('ℹ️  Todos los perfiles ya tienen profesión definida');
    }

    // Mostrar resumen final
    const totalProfiles = await dataSource.query(`
      SELECT COUNT(*) as total FROM profiles
    `);

    const profilesWithADefinir = await dataSource.query(`
      SELECT COUNT(*) as count FROM profiles WHERE profession = 'A Definir'
    `);

    console.log('📊 Resumen:');
    console.log(`  - Total de perfiles: ${totalProfiles[0].total}`);
    console.log(
      `  - Perfiles con "A Definir": ${profilesWithADefinir[0].count}`,
    );

    console.log('🎉 Actualización de profesiones completada!');
  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  } finally {
    await app.close();
  }
}

updateEmptyProfessions().catch(console.error);
