import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Bank } from '../shared/entities/bank.entity';
import { DigitalPlatform } from '../shared/entities/digital-platform.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'users_db',
      }),
  entities: [Bank, DigitalPlatform],
  synchronize: true,
});

async function seedBanksAndPlatforms() {
  try {
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    const bankRepository = dataSource.getRepository(Bank);
    const digitalPlatformRepository = dataSource.getRepository(DigitalPlatform);

    // Verificar si ya existen datos
    const existingBanks = await bankRepository.count();
    const existingPlatforms = await digitalPlatformRepository.count();

    if (existingBanks > 0 && existingPlatforms > 0) {
      console.log('📊 Los datos de bancos y plataformas digitales ya existen');
      return;
    }

    // Insertar bancos argentinos principales
    const banks = [
      { name: 'Banco de la Nación Argentina', code: 'BN' },
      { name: 'Banco Santander Argentina', code: 'SAN' },
      { name: 'Banco Galicia', code: 'GAL' },
      { name: 'Banco BBVA Argentina', code: 'BBVA' },
      { name: 'Banco Macro', code: 'MAC' },
      { name: 'Banco HSBC Argentina', code: 'HSBC' },
      { name: 'Banco Itaú Argentina', code: 'ITAU' },
      { name: 'Banco Credicoop', code: 'CRED' },
      { name: 'Banco Comafi', code: 'COMAFI' },
      { name: 'Banco ICBC Argentina', code: 'ICBC' },
      { name: 'Banco Patagonia', code: 'PAT' },
      { name: 'Banco Supervielle', code: 'SUP' },
      { name: 'Banco Hipotecario', code: 'HIP' },
      { name: 'Banco de la Ciudad de Buenos Aires', code: 'CBA' },
      { name: 'Banco de Córdoba', code: 'COR' },
      { name: 'Banco de la Provincia de Buenos Aires', code: 'BPBA' },
      { name: 'Banco de Santa Fe', code: 'SF' },
      { name: 'Banco de Tucumán', code: 'TUC' },
      { name: 'Banco de Mendoza', code: 'MEN' },
      { name: 'Banco de Salta', code: 'SAL' },
    ];

    // Insertar plataformas digitales argentinas principales
    const digitalPlatforms = [
      { name: 'Mercado Pago', code: 'MP' },
      { name: 'Ualá', code: 'UALA' },
      { name: 'Nubank', code: 'NUBANK' },
      { name: 'Brubank', code: 'BRUBANK' },
      { name: 'Rebanking', code: 'REBANKING' },
      { name: 'Wilo', code: 'WILO' },
      { name: 'Prex', code: 'PREX' },
      { name: 'Naranja X', code: 'NARANJA' },
      { name: 'Personal Pay', code: 'PERSONAL' },
      { name: 'Movistar Money', code: 'MOVISTAR' },
      { name: 'Claro Pay', code: 'CLARO' },
      { name: 'Banco del Sol', code: 'SOL' },
      { name: 'Banco Industrial', code: 'INDUSTRIAL' },
      { name: 'Banco de Valores', code: 'VALORES' },
      { name: 'Banco Piano', code: 'PIANO' },
    ];

    // Insertar bancos
    if (existingBanks === 0) {
      console.log('🏦 Insertando bancos...');
      for (const bankData of banks) {
        const bank = bankRepository.create({
          ...bankData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await bankRepository.save(bank);
      }
      console.log(`✅ ${banks.length} bancos insertados correctamente`);
    } else {
      console.log('🏦 Los bancos ya existen, omitiendo inserción');
    }

    // Insertar plataformas digitales
    if (existingPlatforms === 0) {
      console.log('💳 Insertando plataformas digitales...');
      for (const platformData of digitalPlatforms) {
        const platform = digitalPlatformRepository.create({
          ...platformData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await digitalPlatformRepository.save(platform);
      }
      console.log(
        `✅ ${digitalPlatforms.length} plataformas digitales insertadas correctamente`,
      );
    } else {
      console.log(
        '💳 Las plataformas digitales ya existen, omitiendo inserción',
      );
    }

    console.log(
      '🎉 Seed de bancos y plataformas digitales completado exitosamente',
    );
  } catch (error) {
    console.error(
      '❌ Error durante el seed de bancos y plataformas digitales:',
      error,
    );
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Ejecutar el seed
seedBanksAndPlatforms()
  .then(() => {
    console.log('✅ Script de seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script de seed:', error);
    process.exit(1);
  });
