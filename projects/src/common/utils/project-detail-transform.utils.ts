import { Project } from '../../projects/entities/project.entity';
import { ProjectDetailResponse } from '../../projects/response/project-detail-response';

export interface UserWithProfile {
  id?: number;
  user?: {
    id: number;
  };
  profile?: {
    name: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface Skill {
  id: number;
  name: string;
}

export function transformProjectToDetailResponse(
  project: Project,
  ownerData: UserWithProfile,
  skillsMap: Map<number, string>,
  currentUserId: number,
  location?: string,
  approvedApplications: number = 0,
): ProjectDetailResponse {
  // Obtener el ID del propietario desde cualquiera de las dos estructuras posibles
  const ownerId = ownerData.user?.id || ownerData.id || project.userId;

  // Map roles into the detailed shape
  const roles = (project.roles || []).map((role) => {
    const roleSkills =
      role.roleSkills?.map((rs) => ({ id: rs.skillId, name: skillsMap.get(rs.skillId) })) || [];


    return {
      id: role.id,
      title: role.title,
      description: role.description,
      applicationTypes: role.applicationTypes || [],
      contractType: role.contractType ? { id: role.contractType.id, name: role.contractType.name } : null,
      collaborationType: role.collaborationType ? { id: role.collaborationType.id, name: role.collaborationType.name } : null,
      maxCollaborators: role.maxCollaborators ?? null,
      skills: roleSkills,
    };
  });

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    image: project.image,
    location,
    owner: ownerData.profile ? ownerData.profile.name + ' ' + ownerData.profile.lastName : '',
    ownerId,
    ownerImage: ownerData.profile?.profilePicture,
    roles: roles.length > 0 ? roles : undefined,
    category: [project.category.name],
    isActive: project.isActive,
    deletedAt: project.deletedAt ? project.deletedAt.toISOString() : undefined,
    startDate: project.startDate,
    endDate: project.endDate,
  isOwner: project.userId === currentUserId,
    approvedApplications,
    hasReported: false, // El use case lo sobrescribirá con el valor correcto
  };
}

export function extractSkillIdsFromProjects(projects: Project[]): number[] {
  const allSkillIds = new Set<number>();
  projects.forEach((project) => {
    project.roles?.forEach((role) => {
      role.roleSkills?.forEach((rs) => allSkillIds.add(rs.skillId));
    });
  });
  return Array.from(allSkillIds);
}

export function createSkillsMap(skills: Skill[]): Map<number, string> {
  return new Map(skills.map((skill) => [skill.id, skill.name]));
}

export function getProjectSkillNames(
  project: Project,
  skillsMap: Map<number, string>,
): string[] {
  const names =
    project.roles
      ?.flatMap((role) => role.roleSkills?.map((rs) => skillsMap.get(rs.skillId)) || []) || [];
  return names.filter((name): name is string => typeof name === 'string');
}
