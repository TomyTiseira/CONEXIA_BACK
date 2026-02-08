import { Injectable, Logger } from '@nestjs/common';
import { ITool, ToolSchema } from '../tools/tool.interface';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);
  private readonly tools = new Map<string, ITool>();

  /**
   * Registra una herramienta en el sistema
   */
  registerTool(tool: ITool): void {
    this.tools.set(tool.name, tool);
    this.logger.log(`Tool "${tool.name}" registered`);
  }

  /**
   * Registra múltiples herramientas
   */
  registerTools(tools: ITool[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Obtiene el esquema de todas las herramientas para OpenAI
   */
  getToolsSchema(): ToolSchema[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Ejecuta una herramienta por su nombre
   */
  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }

    this.logger.log(`Executing tool "${toolName}" with args:`, args);

    try {
      const result = await tool.execute(args);
      return result;
    } catch (error) {
      this.logger.error(`Error executing tool "${toolName}":`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las herramientas registradas
   */
  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }
}
