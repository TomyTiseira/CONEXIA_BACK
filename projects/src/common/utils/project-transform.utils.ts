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
  appliedProjectIds: Set<number> = new Set(),
  approvedApplicationsMap: Map<number, number> = new Map(),
  postulationStatusMap: Map<number, { code: string }> = new Map(),
  contractTypeMap?: Map<number, string>,
  collaborationTypeMap?: Map<number, string>,
): ProjectResponseDto[] {
  const usersMap = new Map(users.map((user) => [user.id, user]));

  return projects.map((project) => {
    const user = usersMap.get(project.userId);
    const profile = user?.profile;

    // Agregar resumen agrupado de tipos de contratación y modalidades de colaboración
    const contractTypesSet = new Set<string>();
    const collaborationTypesSet = new Set<string>();
    if (project.roles && project.roles.length > 0) {
      for (const role of project.roles) {
        // Preferir la relación poblada; si no está, usar los mapas por id como fallback
        if (role.contractType && role.contractType.name) {
          contractTypesSet.add(role.contractType.name);
        } else if (contractTypeMap && (role as any).contractTypeId) {
          const name = contractTypeMap.get((role as any).contractTypeId);
          if (name) contractTypesSet.add(name);
        }

        if (role.collaborationType && role.collaborationType.name) {
          collaborationTypesSet.add(role.collaborationType.name);
        } else if (collaborationTypeMap && (role as any).collaborationTypeId) {
          const name = collaborationTypeMap.get((role as any).collaborationTypeId);
          if (name) collaborationTypesSet.add(name);
        }
      }
    }

    const contractTypes = Array.from(contractTypesSet);
    const collaborationTypes = Array.from(collaborationTypesSet);

    return {
      id: project.id,
      title: project.title,
      image: project.image,
      category: {
        id: project.category.id,
        name: project.category.name,
      },
      // collaborationType and contractType are role-scoped and not included here
      owner: {
        id: user?.id || project.userId,
        name: profile
          ? `${profile.name} ${profile.lastName}`
          : '',
        image: profile?.profilePicture,
      },
      isOwner: currentUserId === project.userId,
      endDate: project.endDate ? project.endDate.toISOString() : undefined,
      deletedAt: project.deletedAt
        ? project.deletedAt.toISOString()
        : undefined,
      isActive: project.isActive,
      isApplied: appliedProjectIds.has(project.id),
      approvedApplications: approvedApplicationsMap.get(project.id) || 0,
      postulationStatus: postulationStatusMap.get(project.id) ?? null,
      summary: {
        contractTypes,
        collaborationTypes,
      },
    };
  });
}
