import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { ContractType } from '../projects/entities/contract-type.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'projects_db',
  entities: [ContractType],
  synchronize: false,
  logging: false,
});

const contractTypes = [
  { name: 'Por Proyecto', description: 'Pago por proyecto completado' },
  { name: 'Por Hora', description: 'Pago por hora trabajada' },
  { name: 'Por Mes', description: 'Pago mensual fijo' },
  {
    name: 'Por Resultado',
    description: 'Pago basado en resultados específicos',
  },
  { name: 'Colaboración', description: 'Colaboración sin pago monetario' },
];

async function seedContractTypes() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ContractType);

  for (const contractType of contractTypes) {
    const exists = await repo.findOne({ where: { name: contractType.name } });
    if (!exists) {
      await repo.save(contractType);
      console.log(`Tipo de contrato '${contractType.name}' creado.`);
    } else {
      console.log(`Tipo de contrato '${contractType.name}' ya existe.`);
    }
  }

  await AppDataSource.destroy();
}

seedContractTypes()
  .then(() => {
    console.log('Seed de tipos de contrato finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de tipos de contrato:', err);
    process.exit(1);
  });
