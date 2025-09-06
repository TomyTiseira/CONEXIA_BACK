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
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
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
   * Genera una clave de caché para recomendaciones
   */
  generateRecommendationsKey(
    userId: number,
    limit: number,
    page: number,
  ): string {
    return `recommendations:${userId}:${limit}:${page}`;
  }

  /**
   * Genera una clave de caché para amigos en común
   */
  generateMutualFriendsKey(userId1: number, userId2: number): string {
    return `mutual_friends:${Math.min(userId1, userId2)}:${Math.max(userId1, userId2)}`;
  }

  /**
   * Genera una clave de caché para habilidades de usuario
   */
  generateUserSkillsKey(userId: number): string {
    return `user_skills:${userId}`;
  }
}
