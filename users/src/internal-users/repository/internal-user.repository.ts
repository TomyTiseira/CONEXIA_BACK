import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'src/common/constants/roles';
import { Role } from 'src/shared/entities/role.entity';
import { User } from 'src/shared/entities/user.entity';
import { UserRepository } from 'src/users/repository/users.repository';
import { In, Repository } from 'typeorm';
import { GetInternalUsersDto } from '../dto/get-internal-users.dto';

@Injectable()
export class InternalUserRepository extends UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findRoleById(roleId: number) {
    return this.userRepository.manager.findOne(Role, {
      where: { id: roleId },
    });
  }

  async findRolesByNames(names: RoleName[]) {
    return this.userRepository.manager.find(Role, {
      where: { name: In(names) },
    });
  }

  async findAllInternalUsers(getInternalUsersDto: GetInternalUsersDto) {
    const {
      email,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      includeDeleted,
    } = getInternalUsersDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name IN (:...roleNames)', {
        roleNames: ['admin', 'moderador'],
      });

    // Incluir registros eliminados si se solicita
    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    // Aplicar filtros de búsqueda
    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    // Aplicar filtros de fecha
    if (startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate });
    }

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit).orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    // Transformar los datos para incluir isActive
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role.name,
      createdAt: user.createdAt,
      isActive: user.deletedAt === null,
    }));

    return [transformedUsers, total];
  }

  async deleteInternalUser(id: number) {
    return this.userRepository.softDelete(id);
  }
}
