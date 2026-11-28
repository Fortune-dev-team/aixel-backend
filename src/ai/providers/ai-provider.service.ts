import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiGenerationResult {
  text: string;
  provider: string;
  model: string;
}

export interface AiEmbeddingResult {
  vector: number[];
  provider: string;
  model: string;
}

@Injectable()
export class AiProviderService {
  constructor(private readonly config: ConfigService) {}

  async generate(prompt: string): Promise<AiGenerationResult> {
    const provider = this.config.get<string>('LLM_PROVIDER', 'gemini');

    if (provider === 'gemini') return this.generateGemini(prompt);
    if (provider === 'openai') return this.generateOpenAi(prompt);
    if (provider === 'ollama') return this.generateOllama(prompt);

    throw new InternalServerErrorException(
      `Unsupported LLM_PROVIDER: ${provider}`,
    );
  }

  async embed(text: string): Promise<AiEmbeddingResult> {
    const provider = this.config.get<string>(
      'EMBEDDING_PROVIDER',
      this.config.get<string>('LLM_PROVIDER', 'gemini'),
    );

    let result: AiEmbeddingResult;

    if (provider === 'gemini') result = await this.embedGemini(text);
    else if (provider === 'openai') result = await this.embedOpenAi(text);
    else if (provider === 'ollama') result = await this.embedOllama(text);
    else {
      throw new InternalServerErrorException(
        `Unsupported EMBEDDING_PROVIDER: ${provider}`,
      );
    }

    const expectedDimension = Number(
      this.config.get<string>('EMBEDDING_DIM', '768'),
    );

    if (result.vector.length !== expectedDimension) {
      throw new InternalServerErrorException(
        `Embedding dimension mismatch: expected ${expectedDimension}, received ${result.vector.length}`,
      );
    }

    return result;
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    timeoutMs = 30_000,
    maxRetries = 0,
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;

      try {
        response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });
      } catch (error) {
        console.error('[AI] Request failed:', {
          url,
          timeoutMs,
          attempt: attempt + 1,
          maxRetries,
          error: error instanceof Error ? error.message : 'unknown error',
        });

        throw new ServiceUnavailableException(
          `AI provider request failed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');

        const shouldRetry =
          (response.status === 429 || response.status === 503) &&
          attempt < maxRetries;

        if (shouldRetry) {
          const delayMs = 2_000 * Math.pow(2, attempt);

          console.warn(
            `[AI] Provider returned ${response.status}. Retry ${
              attempt + 1
            }/${maxRetries} in ${delayMs / 1000}s`,
          );

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw new ServiceUnavailableException(
          `AI provider returned ${response.status}: ${body.slice(0, 500)}`,
        );
      }

      try {
        return (await response.json()) as T;
      } catch (error) {
        throw new ServiceUnavailableException(
          `AI provider returned invalid JSON: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    throw new ServiceUnavailableException(
      'AI provider failed after all retry attempts',
    );
  }

  private async generateGemini(prompt: string): Promise<AiGenerationResult> {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    const model = this.config.get<string>(
      'GEMINI_MODEL',
      'gemini-3.8-flash', //ini urg ganti dulu dari 2.0 jadi 3.8 bntr
    );

    const response = await this.request<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
      90_000,
      3,
    );

    const text = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('');

    if (!text) {
      throw new ServiceUnavailableException(
        'Gemini returned an empty response',
      );
    }

    return { text, provider: 'gemini', model };
  }

  private async generateOpenAi(prompt: string): Promise<AiGenerationResult> {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    const response = await this.request<{
      choices?: Array<{ message?: { content?: string } }>;
    }>('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const text = response.choices?.[0]?.message?.content;
    if (!text) {
      throw new ServiceUnavailableException(
        'OpenAI returned an empty response',
      );
    }

    return { text, provider: 'openai', model };
  }

  private async generateOllama(prompt: string): Promise<AiGenerationResult> {
    const baseUrl = this.config.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    const model = this.config.get<string>('OLLAMA_MODEL', 'llama3.2');

    const response = await this.request<{ response?: string }>(
      `${baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
      },
    );

    if (!response.response) {
      throw new ServiceUnavailableException(
        'Ollama returned an empty response',
      );
    }

    return { text: response.response, provider: 'ollama', model };
  }

  private async embedGemini(text: string): Promise<AiEmbeddingResult> {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    const model = this.config.get<string>(
      'GEMINI_EMBEDDING_MODEL',
      'gemini-embedding-001',
    );

    const response = await this.request<{
      embedding?: { values?: number[] };
    }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          outputDimensionality: Number(
            this.config.get<string>('EMBEDDING_DIM', '768'),
          ),
        }),
      },
    );

    const vector = response.embedding?.values;
    if (!vector?.length) {
      throw new ServiceUnavailableException('Gemini returned no embedding');
    }

    return { vector, provider: 'gemini', model };
  }

  private async embedOpenAi(text: string): Promise<AiEmbeddingResult> {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    const model = this.config.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );

    const response = await this.request<{
      data?: Array<{ embedding?: number[] }>;
    }>('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        dimensions: Number(this.config.get<string>('EMBEDDING_DIM', '768')),
      }),
    });

    const vector = response.data?.[0]?.embedding;
    if (!vector?.length) {
      throw new ServiceUnavailableException('OpenAI returned no embedding');
    }

    return { vector, provider: 'openai', model };
  }

  private async embedOllama(text: string): Promise<AiEmbeddingResult> {
    const baseUrl = this.config.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    const model = this.config.get<string>(
      'OLLAMA_EMBEDDING_MODEL',
      'nomic-embed-text',
    );

    const response = await this.request<{ embeddings?: number[][] }>(
      `${baseUrl}/api/embed`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, input: text }),
      },
    );

    const vector = response.embeddings?.[0];
    if (!vector?.length) {
      throw new ServiceUnavailableException('Ollama returned no embedding');
    }

    return { vector, provider: 'ollama', model };
  }

  llmProviderName(): string {
    return this.config.get<string>('LLM_PROVIDER', 'gemini');
  }

  llmModelName(): string {
    const provider = this.llmProviderName();

    if (provider === 'openai') {
      return this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    }
    if (provider === 'ollama') {
      return this.config.get<string>('OLLAMA_MODEL', 'llama3.2');
    }
    return this.config.get<string>('GEMINI_MODEL', 'gemini-3.8-flash'); //ini urg ganti dulu dari 2.0 jadi 3.8 bntr
  }
}
