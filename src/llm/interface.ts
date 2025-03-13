/**
 * Interface for LLM clients
 * This allows for easy swapping of different LLM providers
 */

export interface LLMClient {
  /**
   * Extract package specification from a URL
   * @param url The URL to extract package specification from
   * @returns A promise that resolves to the extracted text
   */
  extractPackageSpec(url: string): Promise<string>;
}

export interface LLMClientOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}
