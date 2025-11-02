import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('benefits')
export class Benefit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string; // e.g. public_profile, publish_services

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'boolean' | 'number' | 'enum';

  @Column({ type: 'json', nullable: true })
  options: any; // enum values or extra metadata

  @Column({ default: true })
  active: boolean;
}
