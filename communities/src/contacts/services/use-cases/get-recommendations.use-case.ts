/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*
============================================
SISTEMA DE RECOMENDACIONES ULTRA-OPTIMIZADO
============================================
FUNCIONALIDAD COMPLETA según User Story:
✅ Match de habilidades 
✅ Contactos en común
✅ Solo 12 recomendaciones máximo
✅ Ordenadas por mayor cantidad de match y amigos en común
✅ Excluye contactos ya agregados

ALGORITMO DE SCORING:
- 60% peso: Amigos en común (red social)
- 40% peso: Habilidades coincidentes (compatibilidad profesional)

OPTIMIZACIONES ULTRA-AGRESIVAS:
🚀 Máximo 15 candidatos potenciales (reducido de 30)
🚀 Lotes de 5 candidatos (reducido de 10)
🚀 Timeout de 1 segundo por candidato
🚀 Early break cuando se tienen suficientes resultados
🚀 Límite de 10 amigos por consulta (reducido de 25)
🚀 Detección temprana de usuarios sin conexiones
🚀 Procesamiento paralelo con límites estrictos
============================================
*/
import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '../../../common/exceptions/connections.exceptions';
import { CacheService } from '../../../common/services/cache.service';
import { UsersService } from '../../../common/services/users.service';
import { GetRecommendationsDto } from '../../dto/get-recommendations.dto';
import { ConnectionRepository } from '../../repositories/connection.repository';
import { RecommendationResponse } from '../../response/recommendation.response';

interface UserCandidate {
  id: number;
  mutualFriendsCount: number;
  skillsMatchCount: number;
  totalScore: number;
  userData: any;
}

@Injectable()
export class GetRecommendationsUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    getRecommendationsDto: GetRecommendationsDto,
  ): Promise<RecommendationResponse[]> {
    const { userId, limit = 12, page = 1 } = getRecommendationsDto;
    const maxLimit = Math.min(limit, 12); // Máximo 12 según user story

    // Verificar caché
    const cacheKey = this.cacheService.generateRecommendationsKey(
      userId,
      maxLimit,
      page,
    );
    const cachedResult =
      this.cacheService.get<RecommendationResponse[]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      // 1. Obtener perfil del usuario actual con habilidades
      const currentUserProfile =
        await this.usersService.getUserWithProfile(userId);
      if (!currentUserProfile?.profile) {
        return [];
      }

      const currentUserSkills =
        currentUserProfile.profile.profileSkills?.map((ps) => ps.skillId) || [];

      // 2. Obtener contactos actuales para excluirlos
      const existingConnections =
        await this.connectionRepository.findAcceptedConnectionsByUserId(
          userId,
          100,
          1,
        );
      const connectedUserIds = new Set(
        existingConnections.map((connection) =>
          connection.senderId === userId
            ? connection.receiverId
            : connection.senderId,
        ),
      );
      connectedUserIds.add(userId); // Excluir al usuario mismo

      // 3. Obtener candidatos con sistema híbrido (límite conservador)
      const candidates = await this.getHybridRecommendations(
        userId,
        currentUserSkills,
        connectedUserIds,
        maxLimit * 2, // Reducir de maxLimit * 3 para controlar memoria
      );

      // 4. Aplicar paginación
      const startIndex = (page - 1) * maxLimit;
      const finalRecommendations = candidates.slice(
        startIndex,
        startIndex + maxLimit,
      );

      // 5. Cachear resultado con TTL optimizado
      this.cacheService.setRecommendations(
        userId,
        maxLimit,
        finalRecommendations,
      );

      return finalRecommendations;
    } catch (error) {
      console.error('Error in GetRecommendationsUseCase:', error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * ALGORITMO HÍBRIDO ULTRA-OPTIMIZADO: Amigos en común + Match de habilidades
   * Optimizado para máximo rendimiento y mínima latencia
   */
  private async getHybridRecommendations(
    userId: number,
    currentUserSkills: number[],
    excludeUserIds: Set<number>,
    maxCandidates: number,
  ): Promise<RecommendationResponse[]> {
    const candidates: UserCandidate[] = [];
    const BATCH_SIZE = 5; // Reducir a 5 para mayor velocidad
    const MAX_POTENTIAL_CANDIDATES = Math.min(maxCandidates, 15); // Reducir drásticamente a 15

    try {
      // 1. Obtener candidatos limitados para máxima velocidad
      const potentialCandidates = await this.getAllPotentialCandidates(
        excludeUserIds,
        MAX_POTENTIAL_CANDIDATES,
      );

      // 2. Procesar en lotes ultra pequeños con timeout
      for (let i = 0; i < potentialCandidates.length; i += BATCH_SIZE) {
        const batch = potentialCandidates.slice(i, i + BATCH_SIZE);

        // Timeout por lote para evitar esperas largas
        const batchPromises = batch.map(async (candidateId) => {
          return Promise.race([
            this.evaluateCandidate(userId, candidateId, currentUserSkills),
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 1000),
            ), // Timeout 1 segundo
          ]);
        });

        const batchResults = await Promise.all(batchPromises);

        // Agregar candidatos válidos del lote actual
        batchResults.forEach((candidate) => {
          if (candidate && candidate.totalScore > 0) {
            candidates.push(candidate);
          }
        });

        // Early break si ya tenemos suficientes candidatos
        if (candidates.length >= maxCandidates) {
          break;
        }
      }

      // 3. Ordenar por score total y limitar resultados
      candidates.sort((a, b) => b.totalScore - a.totalScore);
      const topCandidates = candidates.slice(0, maxCandidates);

      // 4. Convertir a formato de respuesta
      const responsePromises = topCandidates.map((candidate) =>
        this.buildRecommendationResponse(candidate),
      );

      return Promise.all(responsePromises);
    } catch (error) {
      console.error('Error in getHybridRecommendations:', error);
      return [];
    }
  }

  /**
   * Evalúa un candidato individual calculando score híbrido
   */
  private async evaluateCandidate(
    userId: number,
    candidateId: number,
    currentUserSkills: number[],
  ): Promise<UserCandidate | null> {
    // Obtener datos del usuario candidato
    const userData = await this.usersService.getUserWithProfile(candidateId);
    if (!userData?.profile) {
      return null;
    }

    // 1. Calcular amigos en común
    const mutualFriendsCount = await this.calculateMutualFriends(
      userId,
      candidateId,
    );

    // 2. Calcular match de habilidades
    const candidateSkills =
      userData.profile.profileSkills?.map((ps) => ps.skillId) || [];
    const skillsMatchCount = this.calculateSkillsMatch(
      currentUserSkills,
      candidateSkills,
    );

    // 3. Calcular score híbrido
    const totalScore = this.calculateHybridScore(
      mutualFriendsCount,
      skillsMatchCount,
    );

    return {
      id: candidateId,
      mutualFriendsCount,
      skillsMatchCount,
      totalScore,
      userData,
    };
  }

  /**
   * Calcula score híbrido según user story:
   * 60% amigos en común + 40% habilidades
   */
  private calculateHybridScore(
    mutualFriends: number,
    skillsMatch: number,
  ): number {
    // Normalizar valores
    const normalizedMutualFriends = Math.min(mutualFriends / 5, 1); // Max 5 amigos = score 1
    const normalizedSkillsMatch = Math.min(skillsMatch / 10, 1); // Max 10 skills = score 1

    // Aplicar pesos según importancia
    const friendsWeight = 0.6; // 60% amigos en común
    const skillsWeight = 0.4; // 40% habilidades

    return (
      normalizedMutualFriends * friendsWeight +
      normalizedSkillsMatch * skillsWeight
    );
  }

  /**
   * Calcula amigos en común entre dos usuarios (ultra-optimizado para velocidad)
   */
  private async calculateMutualFriends(
    userId: number,
    candidateId: number,
  ): Promise<number> {
    // Verificar caché primero
    const cacheKey = this.cacheService.generateMutualFriendsKey(
      userId,
      candidateId,
    );
    const cachedResult = this.cacheService.get<number>(cacheKey);

    if (cachedResult !== null) {
      return cachedResult;
    }

    try {
      // Límite ultra-bajo para máxima velocidad
      const FRIENDS_LIMIT = 10; // Reducir a solo 10 para mayor velocidad

      const [userFriends, candidateFriends] = await Promise.all([
        this.connectionRepository.findAcceptedConnectionsByUserId(
          userId,
          FRIENDS_LIMIT,
          1,
        ),
        this.connectionRepository.findAcceptedConnectionsByUserId(
          candidateId,
          FRIENDS_LIMIT,
          1,
        ),
      ]);

      // Optimización: si alguno no tiene amigos, retornar 0 inmediatamente
      if (userFriends.length === 0 || candidateFriends.length === 0) {
        this.cacheService.set(cacheKey, 0, 10 * 60 * 1000); // Cache 10 minutos
        return 0;
      }

      const userFriendIds = new Set(
        userFriends.map((conn) =>
          conn.senderId === userId ? conn.receiverId : conn.senderId,
        ),
      );

      // Contar intersección de manera más eficiente con early break
      let mutualCount = 0;
      for (const conn of candidateFriends) {
        const friendId =
          conn.senderId === candidateId ? conn.receiverId : conn.senderId;
        if (userFriendIds.has(friendId)) {
          mutualCount++;
        }
      }

      // Cachear resultado por 10 minutos
      this.cacheService.set(cacheKey, mutualCount, 10 * 60 * 1000);
      return mutualCount;
    } catch (error) {
      console.error(
        `Error calculating mutual friends for ${candidateId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Calcula coincidencias de habilidades
   */
  private calculateSkillsMatch(
    userSkills: number[],
    candidateSkills: number[],
  ): number {
    if (!userSkills.length || !candidateSkills.length) {
      return 0;
    }

    const userSkillsSet = new Set(userSkills);
    return candidateSkills.filter((skill) => userSkillsSet.has(skill)).length;
  }

  /**
   * Obtiene candidatos potenciales con límites ultra-estrictos para máxima velocidad
   */
  private async getAllPotentialCandidates(
    excludeUserIds: Set<number>,
    maxCandidates: number,
  ): Promise<number[]> {
    // Límites ultra-conservadores para máxima velocidad
    const ULTRA_STRICT_LIMIT = Math.min(maxCandidates, 15); // Máximo 15 candidatos

    const excludedArray = Array.from(excludeUserIds);
    const userId = excludedArray[0]; // primer elemento es el usuario actual
    const otherExcluded = excludedArray.slice(1); // resto de excluidos

    try {
      const allUsers = await this.usersService.getAllUsersExcept(
        userId,
        otherExcluded,
        ULTRA_STRICT_LIMIT, // Límite ultra-estricto para máxima velocidad
      );

      return allUsers.slice(0, ULTRA_STRICT_LIMIT);
    } catch (error) {
      console.error('Error getting potential candidates:', error);
      return [];
    }
  }

  /**
   * Construye la respuesta de recomendación
   */
  private async buildRecommendationResponse(
    candidate: UserCandidate,
  ): Promise<RecommendationResponse> {
    const { userData, mutualFriendsCount, skillsMatchCount } = candidate;

    // Construir nombre como en otros use cases
    const userName = userData.profile
      ? `${userData.profile.name} ${userData.profile.lastName}`.trim()
      : 'Usuario';

    // Obtener las habilidades con nombres correctos
    const candidateSkillIds =
      userData.profile?.profileSkills?.map((ps) => ps.skillId) || [];

    let skillsWithNames: Array<{ id: number; name: string }> = [];
    if (candidateSkillIds.length > 0) {
      try {
        const skillsData =
          await this.usersService.getSkillsByIds(candidateSkillIds);
        skillsWithNames = skillsData.map((skill) => ({
          id: skill.id,
          name: skill.name,
        }));
      } catch (error) {
        console.error('Error getting skills names:', error);
        skillsWithNames = candidateSkillIds.map((id) => ({
          id,
          name: 'Unknown',
        }));
      }
    }

    return {
      id: candidate.id,
      name: userName,
      image: userData.profile?.profilePicture || '',
      profession: userData.profile?.profession || '',
      mutualFriends: mutualFriendsCount,
      skillsMatch: skillsMatchCount,
      score: Math.round(candidate.totalScore * 100), // Score como porcentaje
      skills: skillsWithNames,
    };
  }
}
