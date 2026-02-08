import { Injectable } from '@nestjs/common';
import {
    PostulationNotActiveException,
    PostulationNotFoundException,
    PostulationNotPendingException,
    ProjectEndedException,
    ProjectMaxCollaboratorsReachedException,
    ProjectNotActiveException,
    ProjectOwnerCannotApplyException,
    RoleNotBelongToProjectException,
    UserAlreadyAppliedException,
    UserNotActiveException,
    UserNotPostulationOwnerException,
    UserNotProjectOwnerException,
} from '../../common/exceptions/postulation.exceptions';
import { ProjectNotFoundException } from '../../common/exceptions/project.exceptions';
import { UsersClientService } from '../../common/services/users-client.service';
import { Project } from '../../projects/entities/project.entity';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { Postulation } from '../entities/postulation.entity';
import { PostulationRepository } from '../repositories/postulation.repository';
import { PostulationContext } from '../states/postulation-context';
import { PostulationStatusService } from './postulation-status.service';

@Injectable()
export class PostulationValidationService {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly postulationStatusService: PostulationStatusService,
    private readonly usersClientService: UsersClientService,
  ) {}

  /**
   * Valida que una postulación existe
   * @param postulationId - ID de la postulación
   * @returns La postulación si existe
   */
  async validatePostulationExists(postulationId: number): Promise<Postulation> {
    const postulation =
      await this.postulationRepository.findById(postulationId);
    if (!postulation) {
      throw new PostulationNotFoundException(postulationId);
    }
    return postulation;
  }

  /**
   * Valida que un proyecto existe y está activo
   * @param projectId - ID del proyecto
   * @returns El proyecto si existe y está activo
   */
  async validateProjectExistsAndActive(projectId: number): Promise<Project> {
    const project = await this.projectRepository.findById(projectId, true);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    if (!project.isActive || project.deletedAt) {
      throw new ProjectNotActiveException(projectId);
    }

    return project;
  }

  /**
   * Valida que un proyecto no ha terminado
   * @param project - Proyecto a validar
   */
  validateProjectNotEnded(project: Project): void {
    if (project.endDate && new Date() > project.endDate) {
      throw new ProjectEndedException(project.id);
    }
  }

  /**
   * Valida que un usuario no es el dueño del proyecto
   * @param project - Proyecto a validar
   * @param userId - ID del usuario
   */
  validateUserNotProjectOwner(project: Project, userId: number): void {
    if (project.userId === userId) {
      throw new ProjectOwnerCannotApplyException(project.id, userId);
    }
  }

  /**
   * Valida que un usuario es el dueño del proyecto
   * @param project - Proyecto a validar
   * @param userId - ID del usuario
   */
  validateUserIsProjectOwner(project: Project, userId: number): void {
    if (project.userId !== userId) {
      throw new UserNotProjectOwnerException(project.id, userId);
    }
  }

  /**
   * Valida que un usuario no esté ya postulado a un proyecto
   * Solo considera postulaciones activas, permitiendo re-postularse si la anterior fue cancelada
   * @param projectId - ID del proyecto
   * @param userId - ID del usuario
   */
  async validateUserNotAlreadyApplied(roleId: number, userId: number): Promise<void> {
    const existingPostulation = await this.postulationRepository.findByRoleAndUser(
      roleId,
      userId,
    );

    if (existingPostulation) {
      // Solo bloquear si la postulación está en estado activo, aceptada o rechazada
      // Permitir nueva postulación si la anterior fue cancelada
      const cancelledStatus = await this.postulationStatusService.getCancelledStatus();

      if (existingPostulation.statusId !== cancelledStatus.id) {
        throw new UserAlreadyAppliedException(roleId, userId);
      }
    }
  }

  /**
   * Valida que una postulación está en estado activo (pendiente)
   * @param postulation - Postulación a validar
   */
  async validatePostulationIsPending(postulation: Postulation): Promise<void> {
    const activeStatus = await this.postulationStatusService.getActiveStatus();

    if (postulation.statusId !== activeStatus.id) {
      throw new PostulationNotPendingException(postulation.id);
    }
  }

  /**
   * Valida que un proyecto no ha alcanzado el máximo de colaboradores
   * @param projectId - ID del proyecto
   * @param maxCollaborators - Máximo número de colaboradores permitidos
   */
  async validateProjectHasAvailableSlots(
    projectId: number,
    maxCollaborators: number,
  ): Promise<void> {
    const postulations =
      await this.postulationRepository.findByProject(projectId);
    const acceptedStatus =
      await this.postulationStatusService.getAcceptedStatus();

    const approvedPostulations = postulations.filter(
      (p) => p.statusId === acceptedStatus.id,
    );

    if (approvedPostulations.length >= maxCollaborators) {
      throw new ProjectMaxCollaboratorsReachedException(projectId);
    }
  }

  /**
   * Valida que un role exista y pertenezca al proyecto
   */
  async validateRoleExists(roleId: number, projectId: number): Promise<void> {
    const role = await this.projectRepository.findRoleById(roleId);
    if (!role) {
      throw new ProjectNotFoundException(roleId); // reuse exception for missing resource
    }

    if (role.projectId !== projectId) {
      throw new RoleNotBelongToProjectException(roleId, projectId);
    }
  }

  /**
   * Valida que un role aún tenga vacantes disponibles según sus vacantes configuradas
   */
  async validateRoleHasAvailableSlots(roleId: number): Promise<void> {
    const role = await this.projectRepository.findRoleById(roleId);
    if (!role) return;
    const max = role.maxCollaborators || 0;
    if (!max || max <= 0) return;
    const acceptedCount = await this.postulationRepository.countAcceptedByRole(roleId);
    if (acceptedCount >= max) {
      throw new ProjectMaxCollaboratorsReachedException(roleId);
    }
  }

  /**
   * Valida el tamaño del archivo CV
   * @param cvSize - Tamaño del archivo en bytes
   * @param maxSize - Tamaño máximo permitido en bytes
   */
  validateCvFileSize(cvSize: number, maxSize: number = 10 * 1024 * 1024): void {
    if (cvSize > maxSize) {
      throw new Error(
        `CV file size cannot exceed ${maxSize / (1024 * 1024)}MB`,
      );
    }
  }

  /**
   * Valida que un proyecto está activo
   * @param project - Proyecto a validar
   */
  validateProjectIsActive(project: Project): void {
    if (!project.isActive || project.deletedAt) {
      throw new ProjectNotActiveException(project.id);
    }
  }

  /**
   * Valida que un usuario esté activo
   * @param userId - ID del usuario
   */
  async validateUserIsActive(userId: number): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.usersClientService.getUserById(userId);
    // Verifica que el usuario exista y que NO esté eliminado
    if (!user || user.deletedAt) {
      throw new UserNotActiveException(userId);
    }
  }

  /**
   * Valida que una postulación esté en estado activo
   * @param postulación a validar
   */
  validatePostulationIsActive(postulation: Postulation): void {
    if (!postulation.status) {
      throw new PostulationNotActiveException(postulation.id);
    }

    const postulationContext = new PostulationContext(postulation);

    if (!postulationContext.canBeCancelled()) {
      throw new PostulationNotActiveException(postulation.id);
    }
  }

  /**
   * Valida que un usuario sea el dueño de la postulación
   * @param postulation - Postulación a validar
   * @param userId - ID del usuario
   */
  validateUserIsPostulationOwner(
    postulation: Postulation,
    userId: number,
  ): void {
    if (postulation.userId !== userId) {
      throw new UserNotPostulationOwnerException(postulation.id, userId);
    }
  }
}
