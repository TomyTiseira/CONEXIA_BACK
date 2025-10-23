import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenAIModerationResult } from '../interfaces/moderation.interface';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY no está configurada. El servicio de moderación no funcionará correctamente.',
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || '',
    });
  }

  /**
   * Analiza un texto usando la API de Moderación de OpenAI
   * @param text Texto a analizar
   * @returns Resultado del análisis de moderación
   */
  async moderateText(text: string): Promise<OpenAIModerationResult> {
    let attempts = 0;
    const maxAttempts = 6;
    let delayMs = 1000;
    while (attempts < maxAttempts) {
      try {
        // Usar 'omni-moderation-latest' para analizar texto e imagenes.
        // Usar 'text-moderation-latest' para analizar solo texto.
        const moderation = await this.openai.moderations.create({
          model: 'omni-moderation-latest',
          input: text,
        });
        return moderation.results[0] as OpenAIModerationResult;
      } catch (error: any) {
        if (error.status === 429) {
          this.logger.warn(
            `Rate limit alcanzado en OpenAI. Reintentando en ${delayMs}ms... (Intento ${attempts + 1})`,
          );
          await new Promise((res) => setTimeout(res, delayMs));
          attempts++;
          // Backoff exponencial con jitter
          delayMs = delayMs * 2 + Math.floor(Math.random() * 1000);
        } else {
          this.logger.error('Error al llamar a OpenAI Moderation API:', error);
          throw new Error('Error al analizar el contenido con OpenAI');
        }
      }
    }
    this.logger.error(
      'Se excedieron los reintentos por rate limit en OpenAI Moderation API',
    );
    throw new Error('Error al analizar el contenido con OpenAI (rate limit)');
  }

  /**
   * Genera un resumen usando GPT-4o-mini sobre el análisis de reportes de un usuario
   * @param userId ID del usuario analizado
   * @param totalReports Total de reportes
   * @param offensiveReports Reportes ofensivos
   * @param violationReports Reportes por incumplimiento
   * @param classification Clasificación final
   * @param reportDetails Detalles de los reportes para contexto
   * @returns Resumen generado por IA
   */
  async generateSummary(
    userId: number,
    totalReports: number,
    offensiveReports: number,
    violationReports: number,
    classification: 'Revisar' | 'Banear',
    reportDetails: string[],
  ): Promise<string> {
    try {
      const prompt = `Eres un asistente de moderación para la plataforma Conexia. Analiza la siguiente información sobre reportes de un usuario y genera un resumen claro y profesional en español.

Usuario ID: ${userId}
Total de reportes: ${totalReports}
Reportes ofensivos/racistas: ${offensiveReports}
Reportes por incumplimiento: ${violationReports}
Clasificación: ${classification}

Algunos ejemplos de los reportes:
${reportDetails.slice(0, 5).join('\n')}

Genera un resumen de 2-3 oraciones que explique:
1. El patrón de comportamiento detectado
2. La gravedad de la situación
3. La recomendación de acción

Mantén un tono profesional y objetivo.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente de moderación profesional que analiza reportes de usuarios y genera resúmenes concisos.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return (
        completion.choices[0].message.content ||
        'No se pudo generar un resumen.'
      );
    } catch (error) {
      this.logger.error('Error al llamar a OpenAI Chat API:', error);

      // Fallback: generar un resumen básico sin IA
      return `El usuario presenta ${totalReports} reportes en total, de los cuales ${offensiveReports} son ofensivos y ${violationReports} por incumplimiento. Clasificación: ${classification}. Se recomienda ${classification === 'Banear' ? 'suspender la cuenta' : 'revisar manualmente'}.`;
    }
  }

  /**
   * Verifica si el servicio de OpenAI está disponible
   */
  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}
