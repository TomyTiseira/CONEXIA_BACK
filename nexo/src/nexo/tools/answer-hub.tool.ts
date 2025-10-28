import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqEmbedding } from '../entities/faq-embedding.entity';
import { ITool } from './tool.interface';

@Injectable()
export class AnswerHubTool implements ITool {
  name = 'search_faqs';
  description =
    'Busca información en las preguntas frecuentes (FAQs) de la plataforma Conexia. Úsala cuando el usuario necesite información sobre cómo funciona Conexia, sus características, servicios o funcionalidades.';
  parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'La consulta del usuario o pregunta sobre Conexia',
      },
    },
    required: ['query'],
  };

  constructor(
    @InjectRepository(FaqEmbedding)
    private readonly faqRepository: Repository<FaqEmbedding>,
  ) {}

  async execute(args: { query: string }): Promise<any> {
    // Para simplificar, aquí buscaríamos por texto directamente
    // En producción deberías crear un embedding del query y buscar similares
    return this.searchSimilarFaqsByText(args.query);
  }

  async searchSimilarFaqsByText(query: string): Promise<FaqEmbedding[]> {
    // Búsqueda por texto simple (puedes mejorarlo usando embeddings)
    const results = await this.faqRepository
      .createQueryBuilder('faq')
      .where('faq.question ILIKE :query', { query: `%${query}%` })
      .orWhere('faq.answer ILIKE :query', { query: `%${query}%` })
      .take(3)
      .getMany();

    return results;
  }

  // Mantener método antiguo por compatibilidad
  async searchSimilarFaqs(
    embedding: number[],
    limit: number = 3,
  ): Promise<FaqEmbedding[]> {
    // Convertir embedding a string para la query SQL
    const embeddingStr = `[${embedding.join(',')}]`;

    // Query de búsqueda por similitud de coseno usando pgvector
    const query = `
      SELECT 
        id,
        question,
        answer,
        1 - (embedding <=> $1::vector) as similarity
      FROM faq_embedding
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;

    const results = await this.faqRepository.query(query, [
      embeddingStr,
      limit,
    ]);

    // Filtrar resultados con similitud alta (> 0.7)
    return results.filter((r: any) => r.similarity > 0.7);
  }
}
