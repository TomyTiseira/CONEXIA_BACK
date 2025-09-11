import { Injectable } from '@nestjs/common';
import { RecommendationResponse } from '../response/recommendation.response';

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
}

@Injectable()
export class RecommendationsCacheService {
  private readonly cache = new Map<string, { data: any; expiry: number }>();
  private readonly metrics: CacheMetrics = { hits: 0, misses: 0, sets: 0 };

  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas
  private readonly CACHE_PREFIX = 'recommendations';
  private readonly MAX_CACHE_SIZE = 10000; // Máximo 10k entradas

  /**
   * Genera clave de caché optimizada y específica
   */
  generateRecommendationsKey(
    userId: number,
    limit: number,
    page: number,
    version: string = 'v2',
  ): string {
    return `${this.CACHE_PREFIX}:${version}:${userId}:${limit}:${page}`;
  }

  /**
   * Genera clave para caché de amigos de usuario
   */
  generateUserFriendsKey(userId: number): string {
    return `${this.CACHE_PREFIX}:friends:${userId}`;
  }

  /**
   * Genera clave para caché de amigos mutuos
   */
  generateMutualFriendsKey(userId1: number, userId2: number): string {
    const sortedIds = [userId1, userId2].sort();
    return `${this.CACHE_PREFIX}:mutual:${sortedIds[0]}:${sortedIds[1]}`;
  }

  /**
   * Obtiene valor del caché
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      this.metrics.misses++;
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return cached.data as T;
  }

  /**
   * Almacena valor en caché
   */
  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    // Limpiar caché si está muy lleno
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldEntries();
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { data: value, expiry });
    this.metrics.sets++;
  }

  /**
   * Elimina entrada específica del caché
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalida todas las recomendaciones de un usuario
   */
  invalidateUserRecommendations(userId: number): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (
        key.includes(`${this.CACHE_PREFIX}:`) &&
        key.includes(`:${userId}:`)
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalida caché cuando se crea/acepta/rechaza una conexión
   */
  invalidateConnectionCache(userId1: number, userId2: number): void {
    // Invalidar recomendaciones de ambos usuarios
    this.invalidateUserRecommendations(userId1);
    this.invalidateUserRecommendations(userId2);

    // Invalidar caché de amigos
    this.delete(this.generateUserFriendsKey(userId1));
    this.delete(this.generateUserFriendsKey(userId2));

    // Invalidar caché de amigos mutuos
    this.delete(this.generateMutualFriendsKey(userId1, userId2));
  }

  /**
   * Caché específico para recomendaciones con metadatos
   */
  async cacheRecommendationsWithMetadata(
    userId: number,
    limit: number,
    page: number,
    recommendations: RecommendationResponse[],
    metadata: {
      totalFriends: number;
      processingTimeMs: number;
      candidatesEvaluated: number;
    },
  ): Promise<void> {
    const key = this.generateRecommendationsKey(userId, limit, page);
    const cacheData = {
      recommendations,
      metadata,
      cachedAt: new Date().toISOString(),
    };

    // TTL dinámico basado en la cantidad de recomendaciones
    const dynamicTTL =
      recommendations.length > 8 ? this.DEFAULT_TTL : this.DEFAULT_TTL / 2; // Menos tiempo para pocas recomendaciones

    this.set(key, cacheData, dynamicTTL);
  }

  /**
   * Obtiene recomendaciones con metadatos del caché
   */
  getCachedRecommendationsWithMetadata(
    userId: number,
    limit: number,
    page: number,
  ): {
    recommendations: RecommendationResponse[];
    metadata: any;
  } | null {
    const key = this.generateRecommendationsKey(userId, limit, page);
    return this.get(key);
  }

  /**
   * Caché para datos de usuarios obtenidos de microservicio
   */
  cacheUserData(
    userId: number,
    userData: any,
    ttl: number = 60 * 60 * 1000,
  ): void {
    const key = `${this.CACHE_PREFIX}:user:${userId}`;
    this.set(key, userData, ttl); // 1 hora por defecto
  }

  /**
   * Obtiene datos de usuario del caché
   */
  getCachedUserData(userId: number): any | null {
    const key = `${this.CACHE_PREFIX}:user:${userId}`;
    return this.get(key);
  }

  /**
   * Caché para conteo de amigos mutuos
   */
  cacheMutualFriendsCount(
    userId1: number,
    userId2: number,
    count: number,
  ): void {
    const key = this.generateMutualFriendsKey(userId1, userId2);
    this.set(key, count, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Obtiene conteo de amigos mutuos del caché
   */
  getCachedMutualFriendsCount(userId1: number, userId2: number): number | null {
    const key = this.generateMutualFriendsKey(userId1, userId2);
    return this.get(key);
  }

  /**
   * Limpia entradas expiradas del caché
   */
  private evictOldEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Eliminar entradas expiradas
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    // Si aún está muy lleno, eliminar las más antiguas
    if (this.cache.size >= this.MAX_CACHE_SIZE * 0.8) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expiry - b[1].expiry);

      const toDelete = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Limpia todo el caché
   */
  clearAll(): void {
    this.cache.clear();
    this.resetMetrics();
  }

  /**
   * Obtiene métricas del caché
   */
  getMetrics(): CacheMetrics & { hitRate: number; size: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
      size: this.cache.size,
    };
  }

  /**
   * Resetea métricas
   */
  private resetMetrics(): void {
    this.metrics.hits = 0;
    this.metrics.misses = 0;
    this.metrics.sets = 0;
  }

  /**
   * Precarga caché para usuarios activos (puede ejecutarse en background)
   */
  async preloadActiveUsersCache(activeUserIds: number[]): Promise<void> {
    // Esta función puede implementarse para precarga durante horarios de baja actividad
    console.log(`Preloading cache for ${activeUserIds.length} active users`);

    // Implementación para cargar datos frecuentemente solicitados
    for (const userId of activeUserIds.slice(0, 100)) {
      // Limitar a 100 usuarios
      const key = this.generateRecommendationsKey(userId, 12, 1);
      if (!this.get(key)) {
        // Marcar para precarga (implementar lógica de precarga aquí)
        console.log(`Cache miss for user ${userId}, marking for preload`);
      }
    }
  }
}
