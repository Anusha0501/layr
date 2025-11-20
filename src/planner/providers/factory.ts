import { AIProvider, AIProviderFactory, AIProviderType, UnsupportedProviderError } from '../interfaces';
import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';

/**
 * Factory for creating AI providers
 */
export class DefaultAIProviderFactory implements AIProviderFactory {
  private static instance: DefaultAIProviderFactory;

  private constructor() {}

  public static getInstance(): DefaultAIProviderFactory {
    if (!DefaultAIProviderFactory.instance) {
      DefaultAIProviderFactory.instance = new DefaultAIProviderFactory();
    }
    return DefaultAIProviderFactory.instance;
  }

  createProvider(type: AIProviderType, config: any): AIProvider {
    switch (type) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'groq':
        return new GroqProvider(config);
      default:
        throw new UnsupportedProviderError(type);
    }
  }

  getSupportedProviders(): AIProviderType[] {
    return ['gemini', 'groq'];
  }
}

/**
 * Convenience function to get the default factory instance
 */
export function getAIProviderFactory(): AIProviderFactory {
  return DefaultAIProviderFactory.getInstance();
}