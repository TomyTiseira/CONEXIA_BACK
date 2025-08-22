import { Project } from '../../projects/entities/project.entity';
import { ProjectResponseDto } from '../../projects/response/project-response';

export interface UserWithProfile {
  id: number;
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

export function transformProjectsWithOwners(
  projects: Project[],
  users: UserWithProfile[],
  currentUserId: number,
  skillsMap?: Map<number, string>,
): ProjectResponseDto[] {
  const usersMap = new Map(users.map((user) => [user.id, user]));

  return projects.map((project) => {
    const user = usersMap.get(project.userId);
    const profile = user?.profile;

    // Obtener las skills del proyecto
    const projectSkills =
      project.projectSkills?.map((ps) => ({
        id: ps.skillId,
        name: skillsMap?.get(ps.skillId),
      })) || [];

    return {
      id: project.id,
      title: project.title,
      image: project.image,
      category: {
        id: project.category.id,
        name: project.category.name,
      },
      collaborationType: {
        id: project.collaborationType.id,
        name: project.collaborationType.name,
      },
      contractType: {
        id: project.contractType.id,
        name: project.contractType.name,
      },
      owner: {
        id: user?.id || project.userId,
        name: profile
          ? `${profile.name} ${profile.lastName}`
          : 'Usuario no encontrado',
        image: profile?.profilePicture,
      },
      isOwner: currentUserId === project.userId,
      skills: projectSkills,
      endDate: project.endDate ? project.endDate.toISOString() : undefined,
      deletedAt: project.deletedAt
        ? project.deletedAt.toISOString()
        : undefined,
      isActive: project.isActive,
    };
  });
}
