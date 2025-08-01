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

export function transformProjectsWithOwners(
  projects: Project[],
  users: UserWithProfile[],
  currentUserId: number,
): ProjectResponseDto[] {
  const usersMap = new Map(users.map((user) => [user.id, user]));

  return projects.map((project) => {
    const user = usersMap.get(project.userId);
    const profile = user?.profile;

    return {
      id: project.id,
      title: project.title,
      image: project.image,
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
    };
  });
}
