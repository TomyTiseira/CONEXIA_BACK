/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*
============================================
SISTEMA DE RECOMENDACIONES SOLO POR AMIGOS EN COMÚN
============================================
IMPORTANTE: Este sistema SOLO recomienda usuarios basándose en amigos en común.
TODA la lógica relacionada con habilidades está COMENTADA INTENCIONALMENTE.

FUNCIONALIDAD:
- Busca usuarios que tienen amigos en común con el usuario actual
- Ordena por cantidad de amigos en común (más amigos = mayor prioridad)
- NO considera habilidades, profesiones, o cualquier otro criterio

PARA REACTIVAR HABILIDADES:
- Descomenta los métodos marcados con "COMENTADO INTENCIONALMENTE"
- Descomenta la lógica en getRecommendationsWithStrategy
============================================
*/
import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '../../../common/exceptions/connections.exceptions';
import { CacheService } from '../../../common/services/cache.service';
import { UsersService } from '../../../common/services/users.service';
import { GetRecommendationsDto } from '../../dto/get-recommendations.dto';
import { ConnectionRepository } from '../../repositories/connection.repository';
import { RecommendationResponse } from '../../response/recommendation.response';

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

    // Usar el límite especificado (máximo 12)
    const maxLimit = Math.min(limit, 12);

    // Verificar caché de 24 horas primero
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
      // Obtener el perfil del usuario actual con sus habilidades
      const currentUserProfile =
        await this.usersService.getUserWithProfile(userId);
      if (!currentUserProfile?.profile) {
        return [];
      }

      // Obtener las habilidades del usuario actual
      const currentUserSkills =
        currentUserProfile.profile.profileSkills?.map((ps) => ps.skillId) || [];

      // Obtener amigos del usuario (OPTIMIZADO: Solo los necesarios)
      const friends =
        await this.connectionRepository.findAcceptedConnectionsByUserId(
          userId,
          Math.min(maxLimit, 20), // Máximo 20 amigos
          1,
        );
      const friendIds = new Set(
        friends.map((connection) =>
          connection.senderId === userId
            ? connection.receiverId
            : connection.senderId,
        ),
      );

      // NUEVA ESTRATEGIA: Buscar usuarios con más de 3 amigos en común primero
      const recommendations = await this.getRecommendationsWithStrategy(
        userId,
        currentUserSkills,
        Array.from(friendIds),
        maxLimit,
      );

      // Aplicar paginación
      const startIndex = (page - 1) * maxLimit;
      const endIndex = startIndex + maxLimit;

      const finalRecommendations = recommendations.slice(startIndex, endIndex);

      // Almacenar en caché por 24 horas
      this.cacheService.set(
        cacheKey,
        finalRecommendations,
        24 * 60 * 60 * 1000,
      );

      return finalRecommendations;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  /**
   * ESTRATEGIA DE RECOMENDACIONES SOLO POR AMIGOS EN COMÚN
   * IMPORTANTE: Esta función NO incluye lógica de habilidades, solo amigos en común
   */
  private async getRecommendationsWithStrategy(
    userId: number,
    currentUserSkills: number[], // PARÁMETRO MANTENIDO PARA COMPATIBILIDAD PERO NO USADO
    friendIds: number[],
    maxLimit: number,
  ): Promise<RecommendationResponse[]> {
    const allRecommendations: RecommendationResponse[] = [];
    const processedUserIds = new Set<number>();

    // PASO 1: Buscar usuarios con amigos en común (ÚNICA ESTRATEGIA)
    const mutualFriendsCandidates = await this.getUsersWithMutualFriends(
      userId,
      friendIds,
      Math.min(maxLimit, 15), // Máximo 15 candidatos
    );

    // Procesar candidatos con amigos en común
    for (const candidateId of mutualFriendsCandidates) {
      if (processedUserIds.has(candidateId)) continue;

      try {
        const recommendation = await this.processSingleCandidate(
          userId,
          candidateId,
          currentUserSkills, // PASADO PERO NO USADO PARA HABILIDADES
        );

        if (recommendation) {
          allRecommendations.push(recommendation);
          processedUserIds.add(candidateId);
        }
      } catch (error) {
        console.error(`Error processing candidate ${candidateId}:`, error);
      }
    }

    /*
    ============================================
    LÓGICA DE HABILIDADES COMENTADA INTENCIONALMENTE
    ============================================
    // PASO 2: SIEMPRE completar con usuarios por match de habilidades (OPTIMIZADO)
    const skillsCandidates = await this.getUsersBySkillsMatch(
      userId,
      currentUserSkills,
      friendIds,
      processedUserIds,
      Math.min(maxLimit, 10), // Máximo 10 candidatos por skills
    );

    for (const candidateId of skillsCandidates) {
      if (processedUserIds.has(candidateId)) continue;

      try {
        const recommendation = await this.processSingleCandidate(
          userId,
          candidateId,
          currentUserSkills,
        );

        if (recommendation) {
          allRecommendations.push(recommendation);
          processedUserIds.add(candidateId);
        }
      } catch (error) {
        console.error(
          `Error processing skills candidate ${candidateId}:`,
          error,
        );
      }
    }
    ============================================
    FIN DE LÓGICA DE HABILIDADES COMENTADA
    ============================================
    */

    // PASO 2: Ordenar por puntuación inteligente (SOLO AMIGOS EN COMÚN)
    allRecommendations.sort((a, b) => {
      const scoreA = this.calculateIntelligentScore(
        a.mutualFriends,
        a.skillsMatch,
      );
      const scoreB = this.calculateIntelligentScore(
        b.mutualFriends,
        b.skillsMatch,
      );

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.id - b.id;
    });

    // PASO 3: Filtrar y limitar resultados
    return this.filterAndLimitResults(allRecommendations, maxLimit);
  }

  /**
   * Obtiene usuarios con amigos en común (sin filtro de cantidad)
   */
  private async getUsersWithMutualFriends(
    userId: number,
    friendIds: number[],
    limit: number,
  ): Promise<number[]> {
    try {
      // Buscar usuarios con amigos en común
      const candidates =
        await this.connectionRepository.getUsersWithMutualFriends(
          userId,
          friendIds,
          limit,
        );

      return candidates;
    } catch (error) {
      console.error('Error getting users with mutual friends:', error);
      return [];
    }
  }

  /*
  ============================================
  MÉTODO DE HABILIDADES COMENTADO INTENCIONALMENTE
  ============================================
  /**
   * Obtiene usuarios por match de habilidades
   * IMPORTANTE: ESTE MÉTODO ESTÁ COMENTADO PORQUE SOLO USAMOS AMIGOS EN COMÚN
   */
  /*
  private async getUsersBySkillsMatch(
    userId: number,
    currentUserSkills: number[],
    friendIds: number[],
    excludedIds: Set<number>,
    limit: number,
  ): Promise<number[]> {
    if (currentUserSkills.length === 0) {
      return [];
    }

    try {
      // Obtener usuarios aleatorios excluyendo amigos y ya procesados
      const allExcludedIds = [...friendIds, ...Array.from(excludedIds)];

      const randomUsers = await this.usersService.getAllUsersExcept(
        userId,
        allExcludedIds,
        Math.min(limit, 8), // Máximo 8 usuarios aleatorios
      );

      const skillsCandidates: { userId: number; skillsMatch: number }[] = [];

      // Evaluar match de habilidades - OPTIMIZADO: Solo evaluar los primeros usuarios
      const usersToEvaluate = randomUsers.slice(0, Math.min(limit * 2, 15)); // Máximo 15 usuarios
      for (const candidateId of usersToEvaluate) {
        try {
          const userData =
            await this.usersService.getUserWithProfile(candidateId);
          if (!userData?.profile) continue;

          const candidateSkills =
            userData.profile.profileSkills?.map((ps) => ps.skillId) || [];

          const skillsMatch = this.calculateSkillsMatch(
            currentUserSkills,
            candidateSkills,
          );

          if (skillsMatch > 0) {
            skillsCandidates.push({ userId: candidateId, skillsMatch });
          }
        } catch (error) {
          console.error(
            `Error evaluating skills for user ${candidateId}:`,
            error,
          );
        }
      }

      // Ordenar por match de habilidades y devolver los mejores
      skillsCandidates.sort((a, b) => b.skillsMatch - a.skillsMatch);
      const result = skillsCandidates.slice(0, limit).map((c) => c.userId);

      return result;
    } catch (error) {
      console.error('Error getting users by skills match:', error);
      return [];
    }
  }
  */
  /*
  ============================================
  FIN DE MÉTODO DE HABILIDADES COMENTADO
  ============================================
  */

  /**
   * Procesa un solo candidato y devuelve su información de recomendación
   */
  private async processSingleCandidate(
    userId: number,
    candidateId: number,
    _currentUserSkills: number[], // PARÁMETRO MANTENIDO PARA COMPATIBILIDAD PERO NO USADO
  ): Promise<RecommendationResponse | null> {
    try {
      const userData = await this.usersService.getUserWithProfile(candidateId);
      if (!userData?.profile) return null;

      // Calcular amigos en común con caché
      const mutualFriendsCacheKey = this.cacheService.generateMutualFriendsKey(
        userId,
        candidateId,
      );
      let mutualFriends = this.cacheService.get<number>(mutualFriendsCacheKey);

      if (mutualFriends === null) {
        mutualFriends = await this.connectionRepository.calculateMutualFriends(
          userId,
          candidateId,
        );
        this.cacheService.set(
          mutualFriendsCacheKey,
          mutualFriends,
          5 * 60 * 1000,
        );
      }

      const userName = userData.profile
        ? `${userData.profile.name} ${userData.profile.lastName}`.trim()
        : '';

      /*
      ============================================
      LÓGICA DE HABILIDADES COMENTADA INTENCIONALMENTE
      ============================================
      // Obtener habilidades del candidato
      const candidateSkills =
        userData.profile.profileSkills?.map((ps) => ps.skillId) || [];

      // Calcular match de habilidades
      const skillsMatch = this.calculateSkillsMatch(
        currentUserSkills,
        candidateSkills,
      );

      // Obtener información de habilidades solo si hay match
      const skillsInfo =
        skillsMatch > 0 ? await this.getSkillsInfo(candidateSkills) : [];
      ============================================
      FIN DE LÓGICA DE HABILIDADES COMENTADA
      ============================================
      */

      // VALORES FIJOS PARA HABILIDADES (NO SE CALCULAN)
      const skillsMatch = 0; // SIEMPRE 0 PORQUE NO HAY LÓGICA DE HABILIDADES
      const skillsInfo: { id: number; name: string }[] = []; // SIEMPRE VACÍO

      return {
        id: candidateId,
        name: userName,
        image: userData.profile?.profilePicture || '',
        profession: userData.profile?.profession || '',
        skillsMatch, // SIEMPRE 0
        mutualFriends,
        skills: skillsInfo, // SIEMPRE VACÍO
      };
    } catch (error) {
      console.error(`Error processing single candidate ${candidateId}:`, error);
      return null;
    }
  }

  /**
   * Calcula puntuación inteligente SOLO POR AMIGOS EN COMÚN
   * IMPORTANTE: NO CONSIDERA HABILIDADES, SOLO AMIGOS EN COMÚN
   */
  private calculateIntelligentScore(
    mutualFriends: number,
    _skillsMatch: number, // PARÁMETRO MANTENIDO PARA COMPATIBILIDAD PERO NO USADO
  ): number {
    /*
    ============================================
    LÓGICA DE HABILIDADES COMENTADA INTENCIONALMENTE
    ============================================
    // Si tiene muchas habilidades (>=10), priorizar habilidades
    if (skillsMatch >= 10) {
      return skillsMatch * 2 + mutualFriends;
    }

    // Si tiene pocas habilidades (<10) pero algunos amigos en común (>=1), priorizar amigos
    if (mutualFriends >= 1) {
      return mutualFriends * 10 + skillsMatch;
    }

    // Si no tiene amigos en común, priorizar habilidades
    return skillsMatch * 3;
    ============================================
    FIN DE LÓGICA DE HABILIDADES COMENTADA
    ============================================
    */

    // SOLO AMIGOS EN COMÚN: Priorizar usuarios con más amigos en común
    return mutualFriends * 10; // Multiplicador alto para priorizar amigos en común
  }

  /**
   * Filtra y limita los resultados priorizando usuarios con >3 amigos en común
   */
  private filterAndLimitResults(
    recommendations: RecommendationResponse[],
    maxLimit: number,
  ): RecommendationResponse[] {
    // Separar usuarios con >3 amigos en común de los demás
    const highMutualFriends = recommendations.filter(
      (r) => r.mutualFriends > 3,
    );
    const others = recommendations.filter((r) => r.mutualFriends <= 3);

    // Si tenemos suficientes usuarios con >3 amigos en común, usar solo esos
    if (highMutualFriends.length >= maxLimit) {
      return highMutualFriends.slice(0, maxLimit);
    }

    // Si no, combinar usuarios con >3 amigos en común + mejores del resto
    const remainingNeeded = maxLimit - highMutualFriends.length;
    const bestOthers = others.slice(0, remainingNeeded);

    return [...highMutualFriends, ...bestOthers];
  }

  /**
   * Procesa candidatos en lotes para optimizar el rendimiento y reducir consultas a BD
   */

  /*
  ============================================
  MÉTODO DE HABILIDADES COMENTADO INTENCIONALMENTE
  ============================================
  /**
   * Obtiene información de habilidades
   * IMPORTANTE: ESTE MÉTODO ESTÁ COMENTADO PORQUE SOLO USAMOS AMIGOS EN COMÚN
   */
  /*
  private async getSkillsInfo(
    skillIds: number[],
  ): Promise<{ id: number; name: string }[]> {
    if (skillIds.length === 0) {
      return [];
    }

    const skills = await this.usersService.getSkillsByIds(skillIds);
    return skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));
  }
  */
  /*
  ============================================
  FIN DE MÉTODO DE HABILIDADES COMENTADO
  ============================================
  */

  /*
  ============================================
  MÉTODO DE HABILIDADES COMENTADO INTENCIONALMENTE
  ============================================
  /**
   * Calcula el número de habilidades que coinciden entre dos usuarios
   * IMPORTANTE: ESTE MÉTODO ESTÁ COMENTADO PORQUE SOLO USAMOS AMIGOS EN COMÚN
   * @param currentUserSkills Array de skillIds del usuario actual
   * @param candidateSkills Array de skillIds del candidato
   * @returns Número de habilidades que coinciden
   */
  /*
  private calculateSkillsMatch(
    currentUserSkills: number[],
    candidateSkills: number[],
  ): number {
    if (currentUserSkills.length === 0 || candidateSkills.length === 0) {
      return 0;
    }

    // Crear un Set para búsqueda más eficiente
    const currentSkillsSet = new Set(currentUserSkills);

    // Contar cuántas habilidades del candidato están en las habilidades del usuario actual
    const matches = candidateSkills.filter((skillId) =>
      currentSkillsSet.has(skillId),
    ).length;

    return matches;
  }
  */
  /*
  ============================================
  FIN DE MÉTODO DE HABILIDADES COMENTADO
  ============================================
  */
}
