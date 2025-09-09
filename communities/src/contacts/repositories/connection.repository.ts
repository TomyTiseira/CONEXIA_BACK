import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, ConnectionStatus } from '../entities';

@Injectable()
export class ConnectionRepository {
  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
  ) {}

  async create(data: Partial<Connection>): Promise<Connection> {
    const connection = this.connectionRepository.create(data);
    return this.connectionRepository.save(connection);
  }

  async findById(id: number): Promise<Connection | null> {
    return this.connectionRepository.findOne({ where: { id } });
  }

  async findBySenderAndReceiver(
    senderId: number,
    receiverId: number,
  ): Promise<Connection | null> {
    return this.connectionRepository.findOne({
      where: { senderId, receiverId },
    });
  }

  async findPendingByReceiver(
    receiverId: number,
    limit: number = 10,
    page: number = 1,
  ): Promise<Connection[]> {
    const offset = (page - 1) * limit;
    return this.connectionRepository.find({
      where: { receiverId, status: ConnectionStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findSentBySender(
    senderId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Connection[]> {
    return this.connectionRepository.find({
      where: { senderId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async updateStatus(id: number, status: ConnectionStatus): Promise<void> {
    await this.connectionRepository.update(id, { status });
  }

  async delete(id: number): Promise<void> {
    await this.connectionRepository.delete(id);
  }

  async existsPendingRequest(
    senderId: number,
    receiverId: number,
  ): Promise<boolean> {
    const count = await this.connectionRepository.count({
      where: {
        senderId,
        receiverId,
        status: ConnectionStatus.PENDING,
      },
    });
    return count > 0;
  }

  async findAcceptedConnectionsByUserId(
    userId: number,
    limit: number = 10,
    page: number = 1,
  ): Promise<[Connection[], number]> {
    const offset = (page - 1) * limit;
    return this.connectionRepository.findAndCount({
      where: [
        { senderId: userId, status: ConnectionStatus.ACCEPTED },
        { receiverId: userId, status: ConnectionStatus.ACCEPTED },
      ],
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findAcceptedConnection(
    userId1: number,
    userId2: number,
  ): Promise<Connection | null> {
    return this.connectionRepository.findOne({
      where: [
        {
          senderId: userId1,
          receiverId: userId2,
          status: ConnectionStatus.ACCEPTED,
        },
        {
          senderId: userId2,
          receiverId: userId1,
          status: ConnectionStatus.ACCEPTED,
        },
      ],
    });
  }
}
