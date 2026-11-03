# AI Integration

## 1. Supported Providers

The initial provider options are:

  Provider   LLM       Embedding
  ---------- --------- -----------
  Gemini     Planned   Planned
  OpenAI     Planned   Planned
  Ollama     Planned   Planned

Actual model names, embedding dimensions, request limits, and pricing
must be configured and verified against the selected provider.

## 2. Provider Abstraction

Business modules should depend on interfaces rather than provider SDKs
directly.

Conceptual interfaces:

``` typescript
export interface LlmProvider {
  generate(input: {
    prompt: string;
    systemInstruction?: string;
  }): Promise<string>;
}

export interface EmbeddingProvider {
  embed(input: string): Promise<number[]>;
}
```

The exact interface should be extended when requirements for streaming,
token usage, structured output, batching, or model metadata are
finalized.

## 3. Provider Selection

Use:

``` env
LLM_PROVIDER=gemini
EMBEDDING_PROVIDER=gemini
EMBEDDING_DIM=768
```

A provider factory resolves the implementation from validated
configuration. Do not scatter `if provider === ...` checks throughout
domain services.

## 4. Document Processing / RAG

Planned high-level flow:

``` mermaid
flowchart TD
    Upload[Document Upload] --> Store[Store Original in Object Storage]
    Store --> Extract[Extract Text]
    Extract --> Chunk[Split into Chunks]
    Chunk --> Embed[Generate Embeddings]
    Embed --> Persist[Persist Chunks and Vectors]
    Query[User Query] --> QueryEmbed[Embed Query]
    QueryEmbed --> Retrieve[Vector Retrieval]
    Retrieve --> Context[Build Context]
    Context --> LLM[LLM Generation]
    LLM --> Result[Return Result]
```

The exact chunking policy, metadata schema, retrieval threshold,
reranking, citation behavior, and prompt templates must be specified and
evaluated before production use.

## 5. Reliability

-   Apply timeouts to provider calls.
-   Handle rate limits and transient errors.
-   Retry only errors that are safe to retry.
-   Avoid retry storms; use bounded exponential backoff.
-   Log provider, model, latency, and usage metadata without logging
    secrets or sensitive prompts.
-   Use queue workers for long-running processing.
-   Provide deterministic mocks for unit tests.

## 6. Embedding Dimension

The vector column dimension must match the embedding model output.
Changing embedding model or dimension may require a re-embedding
migration or data rebuild plan. Do not change `EMBEDDING_DIM`
independently of the stored vector schema.

## 7. Provider Evaluation

Evaluate provider choices on: - Output quality. - Latency. -
Availability. - Token or compute cost. - Rate limits. - Data handling
and privacy. - Operational complexity.
