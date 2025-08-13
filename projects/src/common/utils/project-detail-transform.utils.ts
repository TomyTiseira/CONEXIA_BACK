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
  skillNames: string[],
  currentUserId: number,
  location?: string,
  isApplied: boolean = false,
): ProjectDetailResponse {
  // Obtener el ID del propietario desde cualquiera de las dos estructuras posibles
  const ownerId = ownerData.user?.id || ownerData.id || project.userId;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    image: project.image,
    location,
    owner: ownerData.profile
      ? ownerData.profile.name + ' ' + ownerData.profile.lastName
      : 'Usuario no encontrado',
    ownerId,
    ownerImage: ownerData.profile?.profilePicture,
    contractType: [project.contractType.name],
    collaborationType: [project.collaborationType.name],
    skills: skillNames,
    category: [project.category.name],
    maxCollaborators: project.maxCollaborators,
    isActive: !project.deletedAt,
    startDate: project.startDate,
    endDate: project.endDate,
    isOwner: project.userId === currentUserId,
    isApplied,
  };
}

export function extractSkillIdsFromProjects(projects: Project[]): number[] {
  const allSkillIds = new Set<number>();
  projects.forEach((project) => {
    project.projectSkills.forEach((ps) => {
      allSkillIds.add(ps.skillId);
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
  return project.projectSkills
    .map((ps) => skillsMap.get(ps.skillId))
    .filter((name): name is string => typeof name === 'string');
}
