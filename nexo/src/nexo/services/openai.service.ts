import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { envs } from '../../config';
import { ToolSchema } from '../tools/tool.interface';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  private readonly systemPrompt = `Eres Nexo, el asistente virtual de Conexia, una plataforma de Networking para emprendedores digitales, estudiantes y egresados de carreras tecnológicas y dígitales.

[Tono y formato de la respuesta]
- Usa **emojis con moderación**, idealmente uno o dos según la extensión de la respuesta.
- Incorpora **viñetas** para facilitar la lectura.
- Destaca **conceptos clave** con **texto en negrita**.
- Emplea **listas enumeradas** para instrucciones paso a paso.
- Asegura claridad y concisión. Evita contenido repetitivo.
- Utiliza **lenguaje neutral sin marcar género específico**, evitando formas como "todxs", "todes" o símbolos inclusivos. Usa términos genéricos como "personas", "usuarios" o reformula para evitar especificar género.

[Longitud de la respuesta]
- Las respuestas deben tener un **máximo de 150 tokens o 700 caracteres**.

[Restricciones]
- No compares Conexia con sus competidores ni con otras empresas.
- No des información ni consejos sobre otras empresas.
- Evita **expresiones coloquiales o informales** que puedan afectar la claridad de la comunicación.

Responde basándote en el contexto proporcionado de las FAQs. Si no encuentras la respuesta, di que no tienes esa información pero que puedes ayudar con otras preguntas sobre Conexia.`;

  constructor() {
    this.openai = new OpenAI({
      apiKey: envs.openAIApiKey,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error creating embedding:', error);
      throw error;
    }
  }

  async generateResponse(
    userMessage: string,
    context?: string,
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
  ): Promise<string> {
    try {
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        {
          role: 'system',
          content:
            this.systemPrompt +
            (context ? `\n\nContexto de FAQs:\n${context}` : ''),
        },
      ];

      // Agregar historial de conversación
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(
          ...conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        );
      }

      // Agregar mensaje actual
      messages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating response:', error);
      throw error;
    }
  }

  async generateGreeting(): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              this.systemPrompt +
              '\n\nGenera un mensaje de saludo breve y cálido para un usuario que abre el chat por primera vez o después de 6 horas.',
          },
          {
            role: 'user',
            content: 'Genera un mensaje de saludo para Nexo',
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return (
        response.choices[0].message.content ||
        '¡Hola! 👋 Soy Nexo, tu asistente virtual de Conexia. Estoy aquí para ayudarte con lo que necesites. ¿En qué puedo ayudarte?'
      );
    } catch (error) {
      this.logger.error('Error generating greeting:', error);
      return '¡Hola! 👋 Soy Nexo, tu asistente virtual de Conexia. Estoy aquí para ayudarte con lo que necesites. ¿En qué puedo ayudarte?';
    }
  }

  /**
   * Genera una respuesta con soporte para function calling
   */
  async generateResponseWithTools(
    userMessage: string,
    tools: ToolSchema[],
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
  ): Promise<{
    response: string;
    toolCalls?: Array<{ name: string; arguments: any }>;
  }> {
    try {
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content?: string;
        tool_calls?: any[];
        tool_call_id?: string;
      }> = [
        {
          role: 'system',
          content:
            this.systemPrompt +
            '\n\nTienes acceso a herramientas que puedes usar para ayudar al usuario. Úsalas cuando sea apropiado.',
        },
      ];

      // Agregar historial de conversación
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(
          ...conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        );
      }

      // Agregar mensaje actual
      messages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        tools: tools,
        temperature: 0.7,
        max_tokens: 150,
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Si el modelo quiere llamar a funciones
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCalls = message.tool_calls.map((tc) => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }));

        return {
          response: '',
          toolCalls: toolCalls,
        };
      }

      // Si hay contenido normal
      return {
        response: message.content || '',
        toolCalls: undefined,
      };
    } catch (error) {
      this.logger.error('Error generating response with tools:', error);
      throw error;
    }
  }
}
