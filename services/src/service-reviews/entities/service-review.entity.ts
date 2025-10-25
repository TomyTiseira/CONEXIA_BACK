import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ServiceHiring } from '../../service-hirings/entities/service-hiring.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('service_reviews')
export class ServiceReview {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación con la contratación (unique: un cliente solo puede reseñar una vez por hiring)
  @Column({ name: 'hiring_id', type: 'int', unique: true })
  hiringId: number;

  @ManyToOne(() => ServiceHiring, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hiring_id' })
  hiring: ServiceHiring;

  // Relación con el servicio
  @Column({ name: 'service_id', type: 'int' })
  serviceId: number;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  // Cliente que hace la reseña
  @Column({ name: 'reviewer_user_id', type: 'int' })
  reviewerUserId: number;

  // Dueño del servicio (para facilitar consultas)
  @Column({ name: 'service_owner_user_id', type: 'int' })
  serviceOwnerUserId: number;

  // Calificación (1-5 estrellas)
  @Column({ type: 'int' })
  rating: number;

  // Comentario del cliente
  @Column({ type: 'text' })
  comment: string;

  // Respuesta del dueño del servicio (nullable)
  @Column({ name: 'owner_response', type: 'text', nullable: true })
  ownerResponse: string | null;

  @Column({ name: 'owner_response_date', type: 'timestamp', nullable: true })
  ownerResponseDate: Date | null;

  // Auditoría
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
