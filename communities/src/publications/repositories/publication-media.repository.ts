import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PublicationMedia } from '../entities/publication-media.entity';

@Injectable()
export class PublicationMediaRepository extends Repository<PublicationMedia> {
  constructor(dataSource: DataSource) {
    super(PublicationMedia, dataSource.createEntityManager());
  }

  async findByPublicationId(
    publicationId: number,
  ): Promise<PublicationMedia[]> {
    return this.find({
      where: { publicationId },
      order: { displayOrder: 'ASC' },
    });
  }

  async deleteByPublicationId(publicationId: number): Promise<void> {
    await this.delete({ publicationId });
  }

  async updateDisplayOrder(mediaId: number, newOrder: number): Promise<void> {
    await this.update({ id: mediaId }, { displayOrder: newOrder });
  }
}
