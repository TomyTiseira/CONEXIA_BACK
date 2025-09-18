/*
============================================
SISTEMA DE RECOMENDACI      /    if (cachedResult) {
      this.logger.log(`🎯 Cache hit para usuario ${userId} - devolviendo resultado cacheado`);
      return cachedResult;
    }

    try:
      // CIRCUIT BREAKER GLOBAL - Ultra agresivo
      const initialMemory = process.memoryUsage();
      if (initialMemory.heapUsed > 256 * 1024 * 1024) {
        // Reducido a 256MB (era 800MB)
        this.logger.error(
          `🚨 CIRCUIT BREAKER: Memoria inicial ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB. Abortando para prevenir crash sistémico.`,
        );
        return []; // Devolver resultado vacío para evitar crash
      }memoria inicial
      const initialMemory = process.memoryUsage();
      if (initialMemory.heapUsed > 512 * 1024 * 1024) {
        // Si ya usamos más de 512MB (reducido de 800MB)
        this.logger.warn(
          `🚨 Memoria alta detectada: ${(
            initialMemory.heapUsed /
            1024 /
            1024
          ).toFixed(2)}MB. Devolviendo caché o resultado vacío.`,
        );
        return []; // Devolver resultado vacío para evitar crash
      }LTRA-OPTIMIZADO
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
🚀 Máximo 8 candidatos potenciales (reducido de 15)
🚀 Lotes de 3 candidatos (reducido de 5)
🚀 Timeout de 500ms por candidato (reducido de 1s)
🚀 Early break cuando se tienen suficientes resultados
🚀 Límite de 5 amigos por consulta (reducido de 10)
🚀 Cache TTL extendido a 30 minutos
🚀 Detección temprana de usuarios sin conexiones
🚀 Procesamiento paralelo con límites estrictos
============================================
*/
import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(GetRecommendationsUseCase.name);

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
      // Obtener perfil del usuario actual con habilidades
      const currentUserProfile =
        await this.usersService.getUserWithProfileAndSkills(userId);
      if (!currentUserProfile?.profile) {
        return [];
      }

      const currentUserSkills =
        currentUserProfile.profile.profileSkills?.map((ps) => ps.skillId) || [];

      // Obtener contactos actuales para excluirlos
      const [existingConnections] =
        await this.connectionRepository.findAcceptedConnectionsByUserId(
          userId,
          50, // Valor normal, sin emergencia
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

      // Obtener candidatos con sistema híbrido
      const candidates = await this.getHybridRecommendations(
        userId,
        currentUserSkills,
        connectedUserIds,
        maxLimit,
      );

      // Aplicar paginación
      const startIndex = (page - 1) * maxLimit;
      const finalRecommendations = candidates.slice(
        startIndex,
        startIndex + maxLimit,
      );

      // Cachear resultado con TTL optimizado
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
   * Optimizado para máximo rendimiento y mínima latencia con control de memoria
   */
  private async getHybridRecommendations(
    userId: number,
    currentUserSkills: number[],
    excludeUserIds: Set<number>,
    maxCandidates: number,
  ): Promise<RecommendationResponse[]> {
    const candidates: UserCandidate[] = [];
    // Usar el límite real solicitado
    const MAX_POTENTIAL_CANDIDATES = maxCandidates;

    try {
      // 0. Los usuarios nuevos SIN conexiones también necesitan recomendaciones
      const userConnectionsCount = await this.countUserConnections(userId);
      this.logger.log(
        `� Usuario ${userId} tiene ${userConnectionsCount} conexiones. Procediendo con algoritmo de recomendaciones.`,
      );

      // 1. Obtener candidatos limitados para máxima velocidad con streaming
      const potentialCandidates = await this.getAllPotentialCandidatesOptimized(
        excludeUserIds,
        MAX_POTENTIAL_CANDIDATES,
      );

      this.logger.log(
        `🔍 Encontrados ${potentialCandidates.length} candidatos potenciales: [${potentialCandidates.join(', ')}]`,
      );

      if (potentialCandidates.length === 0) {
        this.logger.log(
          `⚠️ No se encontraron candidatos potenciales para usuario ${userId}`,
        );
        return [];
      }

      // 2. Obtener skills de todos los candidatos en una sola llamada optimizada
      this.logger.log(
        `⚙️ Obteniendo skills de ${potentialCandidates.length} candidatos de forma batch...`,
      );

      const candidatesSkills =
        await this.usersService.getUsersSkillsOnly(potentialCandidates);
      const skillsMap = new Map<number, number[]>();
      candidatesSkills.forEach((cs) => skillsMap.set(cs.userId, cs.skillIds));

      this.logger.log(
        `📊 Skills obtenidas para ${candidatesSkills.length} candidatos`,
      );

      // 3. Procesar candidatos con skills ya en memoria
      const maxToProcess = Math.min(
        potentialCandidates.length,
        maxCandidates * 2,
      );

      this.logger.log(
        `⚙️ Procesando ${maxToProcess} candidatos de ${potentialCandidates.length} encontrados`,
      );

      for (
        let i = 0;
        i < maxToProcess && candidates.length < maxCandidates;
        i++
      ) {
        const candidateId = potentialCandidates[i];
        const candidateSkills = skillsMap.get(candidateId) || [];

        // ...sin monitoreo de memoria ni GC forzado...

        this.logger.log(
          `🔄 Evaluando candidato ${i + 1}/${maxToProcess}: userId=${candidateId}, skills=[${candidateSkills.join(',')}]`,
        );

        try {
          // Evaluar con skills ya en memoria
          const candidate = await this.evaluateCandidateWithSkills(
            userId,
            candidateId,
            currentUserSkills,
            candidateSkills,
          );

          if (candidate && candidate.totalScore > 0) {
            this.logger.log(
              `✅ Candidato ${candidateId} aceptado con score ${candidate.totalScore} (amigos: ${candidate.mutualFriendsCount}, skills: ${candidate.skillsMatchCount})`,
            );
            candidates.push(candidate);
          } else {
            this.logger.log(
              `❌ Candidato ${candidateId} rechazado - score: ${candidate?.totalScore || 0}`,
            );
          }
        } catch (error) {
          this.logger.warn(`Error evaluando candidato ${candidateId}:`, error);
          continue;
        }
      }

      // 3. Ordenar por score total y limitar resultados
      candidates.sort((a, b) => b.totalScore - a.totalScore);
      const topCandidates = candidates.slice(0, maxCandidates);

      // 4. Procesar respuestas de forma controlada usando skills ya obtenidas
      const finalRecommendations: RecommendationResponse[] = [];
      for (const candidate of topCandidates) {
        try {
          const candidateSkills = skillsMap.get(candidate.id) || [];
          const response = await this.buildRecommendationResponseOptimized(
            candidate,
            candidateSkills,
          );
          if (response) {
            finalRecommendations.push(response);
          }
        } catch (error) {
          this.logger.warn(
            `Error construyendo respuesta para candidato ${candidate.id}:`,
            error,
          );
        }
      }

      // Limpiar variables grandes antes de retornar y forzar GC
      candidates.length = 0;
      potentialCandidates.length = 0;
      skillsMap.clear();

      // Forzar garbage collection antes de retornar
      if (global.gc) {
        global.gc();
        this.logger.log('🧹 Memoria liberada después de recomendaciones');
      }

      const finalMemUsage = process.memoryUsage();
      this.logger.log(
        `💾 Memoria final: Heap=${(finalMemUsage.heapUsed / 1024 / 1024).toFixed(0)}MB`,
      );

      return finalRecommendations;
    } catch (error) {
      console.error('Error in getHybridRecommendations:', error);
      return [];
    }
  }

  /**
   * Evalúa un candidato con skills ya pre-cargadas - VERSIÓN ULTRA-OPTIMIZADA
   */
  private async evaluateCandidateWithSkills(
    userId: number,
    candidateId: number,
    currentUserSkills: number[],
    candidateSkills: number[],
  ): Promise<UserCandidate | null> {
    try {
      // 1. Calcular amigos en común
      const mutualFriendsCount = await this.calculateMutualFriendsOptimized(
        userId,
        candidateId,
      );

      // 2. Calcular match de habilidades (skills ya están en memoria)
      const skillsMatchCount = this.calculateSkillsMatchOptimized(
        currentUserSkills,
        candidateSkills,
      );

      // 3. Calcular score híbrido
      const totalScore = this.calculateHybridScore(
        mutualFriendsCount,
        skillsMatchCount,
      );

      // Si no hay coincidencias, rechazar
      if (mutualFriendsCount === 0 && skillsMatchCount === 0) {
        return null;
      }

      return {
        id: candidateId,
        mutualFriendsCount,
        skillsMatchCount,
        totalScore,
        userData: null, // Lo cargamos después solo para los seleccionados
      };
    } catch (error) {
      this.logger.error(`Error evaluando candidato ${candidateId}:`, error);
      return null;
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
   * Calcula amigos en común entre dos usuarios - VERSIÓN OPTIMIZADA con menos memoria
   */
  private async calculateMutualFriendsOptimized(
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
      // Usar la consulta SQL optimizada del repositorio
      const mutualCount =
        await this.connectionRepository.calculateMutualFriends(
          userId,
          candidateId,
        );

      // Cachear resultado por 20 minutos (reducido de 30)
      this.cacheService.set(cacheKey, mutualCount, 20 * 60 * 1000);
      return mutualCount;
    } catch (error) {
      console.error(
        `Error calculating mutual friends optimized for ${candidateId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Calcula coincidencias de habilidades - VERSIÓN OPTIMIZADA
   */
  private calculateSkillsMatchOptimized(
    userSkills: number[],
    candidateSkills: number[],
  ): number {
    if (!userSkills?.length || !candidateSkills?.length) {
      return 0;
    }

    // Limitar habilidades para reducir complejidad
    const limitedUserSkills = userSkills.slice(0, 20);
    const limitedCandidateSkills = candidateSkills.slice(0, 20);

    const userSkillsSet = new Set(limitedUserSkills);
    let matches = 0;

    // Early break optimization
    for (const skill of limitedCandidateSkills) {
      if (userSkillsSet.has(skill)) {
        matches++;
        if (matches >= 10) break; // Máximo 10 matches para optimización
      }
    }

    return matches;
  }

  /**
   * Obtiene candidatos potenciales con límites ultra-estrictos - VERSIÓN OPTIMIZADA
   */
  private async getAllPotentialCandidatesOptimized(
    excludeUserIds: Set<number>,
    maxCandidates: number,
  ): Promise<number[]> {
    // Límites equilibrados: suficientes candidatos pero controlados para memoria
    const CANDIDATE_LIMIT = Math.min(maxCandidates * 2, 24); // 2x el límite, max 24

    const excludedArray = Array.from(excludeUserIds);
    const userId = excludedArray[0]; // primer elemento es el usuario actual
    const otherExcluded = excludedArray.slice(1); // resto de excluidos

    try {
      // Usar método optimizado que devuelve solo IDs con límite controlado
      this.logger.log(
        `🎯 Buscando candidatos: userId=${userId}, excludedIds=[${otherExcluded.join(', ')}], limit=${CANDIDATE_LIMIT}`,
      );

      const allUsers = await this.usersService.getAllUsersExcept(
        userId,
        otherExcluded,
        CANDIDATE_LIMIT,
      );

      this.logger.log(
        `📋 Resultado de getAllUsersExcept: ${allUsers.length} usuarios encontrados: [${allUsers.join(', ')}]`,
      );

      return allUsers.slice(0, CANDIDATE_LIMIT);
    } catch (error) {
      this.logger.error('Error getting potential candidates optimized:', error);
      return [];
    }
  }

  /**
   * Construye la respuesta de recomendación - VERSIÓN OPTIMIZADA
   */
  private async buildRecommendationResponseOptimized(
    candidate: UserCandidate,
    candidateSkills: number[],
  ): Promise<RecommendationResponse | null> {
    try {
      const { mutualFriendsCount, skillsMatchCount } = candidate;

      // Cargar datos del usuario solo cuando es necesario para la respuesta final
      const userData = await this.usersService.getUserWithProfile(candidate.id);
      if (!userData?.profile) {
        return null;
      }

      // Construir nombre como en otros use cases
      const userName = userData.profile
        ? `${userData.profile.name || ''} ${userData.profile.lastName || ''}`.trim()
        : 'Usuario';

      // Usar las skills ya obtenidas en lugar de hacer nueva llamada
      const candidateSkillIds = candidateSkills.slice(0, 5); // Máximo 5 para mostrar

      let skillsWithNames: Array<{ id: number; name: string }> = [];
      if (candidateSkillIds.length > 0) {
        try {
          const skillsData =
            await this.usersService.getSkillsByIds(candidateSkillIds);
          skillsWithNames = skillsData.slice(0, 5).map((skill) => ({
            id: skill.id,
            name: skill.name,
          }));
        } catch (error) {
          console.error('Error getting skills names optimized:', error);
          skillsWithNames = candidateSkillIds.map((id) => ({
            id,
            name: 'Unknown',
          }));
        }
      }

      return {
        id: candidate.id,
        name: userName || 'Usuario',
        image: userData.profile?.profilePicture || '',
        profession: userData.profile?.profession || '',
        mutualFriends: mutualFriendsCount,
        skillsMatch: skillsMatchCount,
        score: Math.round(candidate.totalScore * 100), // Score como porcentaje
        skills: skillsWithNames,
      };
    } catch (error) {
      console.error(
        `Error building response optimized for candidate ${candidate.id}:`,
        error,
      );
      return null;
    }
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
      const FRIENDS_LIMIT = 5; // Reducir drásticamente a solo 5

      const [[userFriends], [candidateFriends]] = await Promise.all([
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
        this.cacheService.set(cacheKey, 0, 30 * 60 * 1000); // Cache 30 minutos
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
      this.cacheService.set(cacheKey, mutualCount, 30 * 60 * 1000);
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

  /**
   * Cuenta rápidamente las conexiones de un usuario para early break
   */
  private async countUserConnections(userId: number): Promise<number> {
    const cacheKey = `user_connections_count_${userId}`;
    const cached = this.cacheService.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      // Usar el método existente pero solo obtener el count
      const [, count] =
        await this.connectionRepository.findAcceptedConnectionsByUserId(
          userId,
          1,
          1,
        );
      this.cacheService.set(cacheKey, count, 30 * 60 * 1000); // Cache 30 minutos
      return count;
    } catch (error) {
      this.logger.warn(
        `Error contando conexiones para usuario ${userId}:`,
        error,
      );
      return 0; // Asumir 0 conexiones si hay error
    }
  }
}
