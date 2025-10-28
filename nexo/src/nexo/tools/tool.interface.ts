export interface ITool {
  /**
   * Nombre único de la herramienta
   */
  name: string;

  /**
   * Descripción de la herramienta para OpenAI
   */
  description: string;

  /**
   * Parámetros que la herramienta acepta (schema JSON)
   */
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };

  /**
   * Ejecuta la herramienta con los parámetros dados
   */
  execute(args: Record<string, any>): Promise<any>;
}

/**
 * Schema de herramienta para OpenAI function calling
 */
export interface ToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
}
