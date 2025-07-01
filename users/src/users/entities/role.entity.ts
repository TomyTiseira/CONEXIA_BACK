import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;
}
