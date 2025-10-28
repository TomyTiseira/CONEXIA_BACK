import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  userId: number;

  @Column('timestamptz', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamptz', { nullable: true })
  updatedAt: Date;

  @OneToMany(() => Message, (message: Message) => message.conversation)
  messages: Message[];
}
