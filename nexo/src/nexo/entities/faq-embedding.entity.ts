import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FaqEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column('vector', { nullable: true })
  embedding: number[] | null;

  @Column('timestamptz', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamptz', { nullable: true })
  updatedAt: Date;
}
