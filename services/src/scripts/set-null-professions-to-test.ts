#!/usr/bin/env ts-node
import { createConnection } from 'typeorm';
import { Service } from '../src/services/entities/service.entity';

async function main() {
  const connection = await createConnection();
  await connection.getRepository(Service)
    .createQueryBuilder()
    .update(Service)
    .set({ profession: 'test' })
    .where('profession IS NULL')
    .execute();
  await connection.close();
  console.log('Profesiones nulas actualizadas a "test"');
}

main().catch((err) => {
  console.error('Error actualizando profesiones:', err);
  process.exit(1);
});
