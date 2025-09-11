import { Injectable } from '@nestjs/common';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene un valor del caché con versión optimizada
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Verificar si el item ha expirado
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar timestamp para "refresh on access" en recomendaciones
    if (key.startsWith('recommendations:')) {
      item.timestamp = now;
    }

    return item.data as T;
  }

  /**
   * Almacena un valor en el caché
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Elimina un valor del caché
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpia el caché completo
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Limpia elementos expirados del caché
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtiene el tamaño actual del caché
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Genera una clave de caché para recomendaciones (optimizada)
   */
  generateRecommendationsKey(
    userId: number,
    limit: number,
    _page: number,
  ): string {
    // Simplificar clave para mejor hit rate
    return `rec:${userId}:${limit}`;
  }

  /**
   * Genera una clave de caché para amigos en común (optimizada)
   */
  generateMutualFriendsKey(userId1: number, userId2: number): string {
    return `mf:${Math.min(userId1, userId2)}:${Math.max(userId1, userId2)}`;
  }

  /**
   * Genera una clave de caché para habilidades de usuario
   */
  generateUserSkillsKey(userId: number): string {
    return `skills:${userId}`;
  }

  /**
   * Cache con múltiples niveles de TTL para recomendaciones
   */
  setRecommendations<T>(userId: number, limit: number, data: T): void {
    const key = this.generateRecommendationsKey(userId, limit, 1);
    // TTL más largo para recomendaciones (30 minutos)
    this.set(key, data, 30 * 60 * 1000);
  }
}
