import { Injectable } from '@nestjs/common';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 3 * 60 * 1000; // Reducir a 3 minutos para liberar memoria más rápido
  private readonly MAX_CACHE_SIZE = 3000; // Límite de cache para controlar memoria

  /**
   * Obtiene un valor del caché con versión optimizada
   */
  get<T>(key: string): T | null {
    // Verificar tamaño del cache y limpiar si es necesario
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldEntries();
    }

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
    if (key.startsWith('recommendations:') || key.startsWith('rec:')) {
      item.timestamp = now;
    }

    return item.data as T;
  }

  /**
   * Almacena un valor en el caché con control de memoria
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldEntries();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Elimina entradas más antiguas para liberar memoria
   */
  private evictOldEntries(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Ordenar por timestamp (más antiguo primero)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Eliminar la mitad más antigua
    const toDelete = entries.slice(0, Math.floor(entries.length / 2));
    toDelete.forEach(([key]) => this.cache.delete(key));
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
