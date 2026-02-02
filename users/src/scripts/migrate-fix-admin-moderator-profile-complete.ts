import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'users-postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'users_user',
    password: process.env.DB_PASSWORD || 'users_password',
    database: process.env.DB_NAME || 'users_db',
    synchronize: false,
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    console.log('\n========================================');
    console.log('Fixing isProfileComplete for all users');
    console.log('========================================\n');

    // Step 1: Fix admins and moderators (should have NULL)
    console.log('Step 1: Setting isProfileComplete = NULL for admins and moderators...');
    const adminModeratorResult = await dataSource.query(`
      UPDATE users u
      SET is_profile_complete = NULL
      WHERE u."roleId" IN (
        SELECT id FROM roles WHERE name IN ('admin', 'moderador')
      )
      AND u.is_profile_complete IS NOT NULL
    `);
    console.log(`✅ ${adminModeratorResult[1]} admins and moderators fixed.\n`);

    // Step 2: Fix regular users with complete profiles (should have true)
    console.log('Step 2: Setting isProfileComplete = true for users with complete profiles...');
    const completeProfilesResult = await dataSource.query(`
      UPDATE users u
      SET is_profile_complete = true
      WHERE u."roleId" = (SELECT id FROM roles WHERE name = 'user')
        AND u."profileId" IS NOT NULL
        AND EXISTS (
          SELECT 1 
          FROM profiles p 
          WHERE p.id = u."profileId"
            AND p.name IS NOT NULL 
            AND TRIM(p.name) != ''
            AND p."lastName" IS NOT NULL 
            AND TRIM(p."lastName") != ''
            AND p.profession IS NOT NULL 
            AND TRIM(p.profession) != ''
            AND p."documentTypeId" IS NOT NULL
            AND p."documentNumber" IS NOT NULL 
            AND TRIM(p."documentNumber") != ''
        )
        AND u.is_profile_complete != true
    `);
    console.log(`✅ ${completeProfilesResult[1]} users with complete profiles fixed.\n`);

    // Step 3: Fix regular users with incomplete profiles (should have false)
    console.log('Step 3: Setting isProfileComplete = false for users with incomplete profiles...');
    const incompleteProfilesResult = await dataSource.query(`
      UPDATE users u
      SET is_profile_complete = false
      WHERE u."roleId" = (SELECT id FROM roles WHERE name = 'user')
        AND (
          u."profileId" IS NULL
          OR NOT EXISTS (
            SELECT 1 
            FROM profiles p 
            WHERE p.id = u."profileId"
              AND p.name IS NOT NULL 
              AND TRIM(p.name) != ''
              AND p."lastName" IS NOT NULL 
              AND TRIM(p."lastName") != ''
              AND p.profession IS NOT NULL 
              AND TRIM(p.profession) != ''
              AND p."documentTypeId" IS NOT NULL
              AND p."documentNumber" IS NOT NULL 
              AND TRIM(p."documentNumber") != ''
          )
        )
        AND u.is_profile_complete != false
    `);
    console.log(`✅ ${incompleteProfilesResult[1]} users with incomplete profiles fixed.\n`);

    // Step 4: Verify results
    console.log('Step 4: Verifying results...');
    const verification = await dataSource.query(`
      SELECT 
        r.name as role,
        COUNT(*) as total,
        COUNT(CASE WHEN u.is_profile_complete = true THEN 1 END) as complete,
        COUNT(CASE WHEN u.is_profile_complete = false THEN 1 END) as incomplete,
        COUNT(CASE WHEN u.is_profile_complete IS NULL THEN 1 END) as null_value
      FROM users u
      JOIN roles r ON u."roleId" = r.id
      GROUP BY r.name
      ORDER BY r.name
    `);

    console.log('\nVerification results:');
    console.table(verification);

    console.log('\n✅ Migration completed successfully!\n');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

migrate();
