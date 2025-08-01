import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LocalityRepository } from '../shared/repository/locality.repository';

const argentineProvinces = [
  { name: 'Buenos Aires', code: 'BA' },
  { name: 'Ciudad Autónoma de Buenos Aires', code: 'CABA' },
  { name: 'Catamarca', code: 'CT' },
  { name: 'Chaco', code: 'CC' },
  { name: 'Chubut', code: 'CH' },
  { name: 'Córdoba', code: 'CB' },
  { name: 'Corrientes', code: 'CR' },
  { name: 'Entre Ríos', code: 'ER' },
  { name: 'Formosa', code: 'FO' },
  { name: 'Jujuy', code: 'JY' },
  { name: 'La Pampa', code: 'LP' },
  { name: 'La Rioja', code: 'LR' },
  { name: 'Mendoza', code: 'MZ' },
  { name: 'Misiones', code: 'MN' },
  { name: 'Neuquén', code: 'NQ' },
  { name: 'Río Negro', code: 'RN' },
  { name: 'Salta', code: 'SA' },
  { name: 'San Juan', code: 'SJ' },
  { name: 'San Luis', code: 'SL' },
  { name: 'Santa Cruz', code: 'SC' },
  { name: 'Santa Fe', code: 'SF' },
  { name: 'Santiago del Estero', code: 'SE' },
  { name: 'Tierra del Fuego, Antártida e Islas del Atlántico Sur', code: 'TF' },
  { name: 'Tucumán', code: 'TU' },
];

async function seedLocalities() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const localityRepository = app.get(LocalityRepository);

  try {
    console.log('🌱 Iniciando seed de localidades...');

    // Verificar si ya existen localidades
    const existingLocalities = await localityRepository.findAll();

    if (!(existingLocalities.length > 0)) {
      // Crear las provincias
      const createdLocalities =
        await localityRepository.createMany(argentineProvinces);

      console.log(
        `✅ Se crearon ${createdLocalities.length} localidades exitosamente:`,
      );
      createdLocalities.forEach((locality) => {
        console.log(`   - ${locality.name} (${locality.code})`);
      });

      console.log('🎉 Seed de localidades completado exitosamente!');
    }
  } catch (error) {
    console.error('❌ Error durante el seed de localidades:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar el seed si el archivo se ejecuta directamente
if (require.main === module) {
  seedLocalities()
    .then(() => {
      console.log('Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en el script:', error);
      process.exit(1);
    });
}

export { seedLocalities };
