import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../shared/entities/role.entity';
import { User } from '../shared/entities/user.entity';
import { UserRepository } from '../users/repository/users.repository';

interface CreateInternalUserDto {
  email: string;
  password: string;
  roleId: number;
}

@Injectable()
export class InternalUsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async createInternalUser(createUserDto: CreateInternalUserDto) {
    const { email, password, roleId } = createUserDto;
    if (!email || !password || !roleId) {
      throw new BadRequestException('Faltan campos requeridos');
    }
    // Validar email único
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }
    // Buscar el rol por id
    const roleEntity = await this.userRepository[
      'ormRepository'
    ].manager.findOne(Role, { where: { id: roleId } });
    if (!roleEntity || !['admin', 'moderador'].includes(roleEntity.name)) {
      throw new BadRequestException('Rol inválido');
    }
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    // Crear usuario
    const user: Partial<User> = {
      email,
      password: hashedPassword,
      roleId: roleEntity.id,
      isValidate: true,
    };
    await this.userRepository.create(user);
    return { message: 'Usuario creado exitosamente' };
  }

  async getInternalRoles(): Promise<{ key: number; value: string }[]> {
    // Solo admin y moderador
    const roles = await this.userRepository['ormRepository'].manager.find(
      Role,
      {
        where: [{ name: 'admin' }, { name: 'moderador' }],
      },
    );
    return roles.map((role: Role) => ({ key: role.id, value: role.name }));
  }
}
