/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function migrateSkills() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔄 Iniciando limpieza de estructura de habilidades...');

  try {
    // Verificar si la columna skills existe en la tabla profiles
    const columnExists = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'skills'
    `);

    if (columnExists.length > 0) {
      console.log('🧹 Eliminando columna skills de la tabla profiles...');

      // Eliminar la columna skills de la tabla profiles
      await dataSource.query(`
        ALTER TABLE profiles DROP COLUMN skills
      `);

      console.log('✅ Columna skills eliminada exitosamente');
    } else {
      console.log('ℹ️  La columna skills ya no existe en la tabla profiles');
    }

    // Verificar que las tablas de habilidades existan
    const skillsTableExists = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'skills'
    `);

    const profileSkillsTableExists = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'profile_skills'
    `);

    if (skillsTableExists.length > 0) {
      console.log('✅ Tabla skills existe');
    } else {
      console.log('❌ Tabla skills no existe');
    }

    if (profileSkillsTableExists.length > 0) {
      console.log('✅ Tabla profile_skills existe');
    } else {
      console.log('❌ Tabla profile_skills no existe');
    }

    console.log('🎉 Limpieza de estructura completada!');
    console.log(
      '💡 Los perfiles ahora usan la nueva estructura de habilidades con tabla separada',
    );
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await app.close();
  }
}

migrateSkills().catch(console.error);
