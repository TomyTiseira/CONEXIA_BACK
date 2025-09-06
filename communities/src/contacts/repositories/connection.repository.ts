/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  ): Promise<Connection[]> {
    const offset = (page - 1) * limit;
    return this.connectionRepository.find({
      where: [
        { senderId: userId, status: ConnectionStatus.ACCEPTED },
        { receiverId: userId, status: ConnectionStatus.ACCEPTED },
      ],
      select: ['id', 'senderId', 'receiverId', 'status'], // Solo campos necesarios
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findCandidateUsers(
    currentUserId: number,
    friendIds: number[],
    limit: number,
  ): Promise<number[]> {
    // Obtener todos los usuarios que no son amigos del usuario actual
    const query = this.connectionRepository
      .createQueryBuilder('connection')
      .select(
        'DISTINCT CASE WHEN connection.senderId = :currentUserId THEN connection.receiverId ELSE connection.senderId END',
        'userId',
      )
      .where(
        '(connection.senderId = :currentUserId OR connection.receiverId = :currentUserId)',
      )
      .andWhere('connection.status = :status')
      .andWhere(
        '(connection.senderId NOT IN (:...friendIds) AND connection.receiverId NOT IN (:...friendIds))',
      )
      .setParameters({
        currentUserId,
        friendIds: friendIds.length > 0 ? friendIds : [0], // Si no hay amigos, usar [0] para evitar error SQL
        status: ConnectionStatus.ACCEPTED,
      })
      .limit(limit);

    const results = await query.getRawMany();
    return results
      .map((result) => result.userId)
      .filter((id) => id !== currentUserId);
  }

  async calculateMutualFriends(
    userId1: number,
    userId2: number,
  ): Promise<number> {
    // Consulta optimizada para calcular amigos en común en una sola query
    const query = `
      WITH user1_friends AS (
        SELECT CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as friend_id
        FROM connections 
        WHERE (sender_id = $1 OR receiver_id = $1) 
        AND status = 'accepted'
      ),
      user2_friends AS (
        SELECT CASE 
          WHEN sender_id = $2 THEN receiver_id 
          ELSE sender_id 
        END as friend_id
        FROM connections 
        WHERE (sender_id = $2 OR receiver_id = $2) 
        AND status = 'accepted'
      )
      SELECT COUNT(*) as mutual_count
      FROM user1_friends u1
      INNER JOIN user2_friends u2 ON u1.friend_id = u2.friend_id
    `;

    const result = await this.connectionRepository.query(query, [
      userId1,
      userId2,
    ]);
    return parseInt(result[0]?.mutual_count || '0');
  }

  async getAllUsersExcept(
    currentUserId: number,
    excludedIds: number[],
    limit: number,
  ): Promise<number[]> {
    // Obtener usuarios de la tabla de conexiones que no sean amigos del usuario actual
    const excludedIdsList = excludedIds.length > 0 ? excludedIds : [0];

    const query = `
      WITH all_connected_users AS (
        SELECT DISTINCT CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as user_id
        FROM connections 
        WHERE (sender_id = $1 OR receiver_id = $1)
        AND status = 'accepted'
      ),
      all_users AS (
        SELECT DISTINCT sender_id as user_id FROM connections WHERE sender_id != $1
        UNION
        SELECT DISTINCT receiver_id as user_id FROM connections WHERE receiver_id != $1
      )
      SELECT user_id
      FROM all_users
      WHERE user_id != $1
      AND user_id NOT IN (${excludedIdsList.map((_, i) => `$${i + 3}`).join(', ')})
      AND user_id NOT IN (SELECT user_id FROM all_connected_users)
      LIMIT $2
    `;

    const params = [currentUserId, limit, ...excludedIdsList];
    const results = await this.connectionRepository.query(query, params);
    return results.map((result) => result.user_id);
  }

  async getUsersWithMutualFriends(
    currentUserId: number,
    excludedIds: number[],
    limit: number,
  ): Promise<number[]> {
    const excludedIdsList = excludedIds.length > 0 ? excludedIds : [0];

    // Consulta optimizada que busca usuarios con amigos en común
    const query = `
      WITH current_user_friends AS (
        SELECT DISTINCT CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as friend_id
        FROM connections 
        WHERE (sender_id = $1 OR receiver_id = $1)
        AND status = 'accepted'
        LIMIT 10
      ),
      users_with_mutual_friends AS (
        SELECT DISTINCT c1.sender_id as user_id,
               COUNT(*) as mutual_count
        FROM connections c1
        INNER JOIN current_user_friends cuf ON c1.receiver_id = cuf.friend_id
        WHERE c1.sender_id != $1
        AND c1.status = 'accepted'
        AND c1.sender_id NOT IN (${excludedIdsList.map((_, i) => `$${i + 2}`).join(', ')})
        GROUP BY c1.sender_id
        
        UNION ALL
        
        SELECT DISTINCT c2.receiver_id as user_id,
               COUNT(*) as mutual_count
        FROM connections c2
        INNER JOIN current_user_friends cuf ON c2.sender_id = cuf.friend_id
        WHERE c2.receiver_id != $1
        AND c2.status = 'accepted'
        AND c2.receiver_id NOT IN (${excludedIdsList.map((_, i) => `$${i + 2}`).join(', ')})
        GROUP BY c2.receiver_id
      )
      SELECT user_id, SUM(mutual_count) as total_mutual
      FROM users_with_mutual_friends
      GROUP BY user_id
      ORDER BY total_mutual DESC, user_id
      LIMIT $${excludedIdsList.length + 2}
    `;

    const params = [currentUserId, ...excludedIdsList, limit];
    const results = await this.connectionRepository.query(query, params);
    return results.map((result) => result.user_id);
  }
}
