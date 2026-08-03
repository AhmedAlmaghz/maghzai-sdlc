/**
 * Examples of using AI SDK with best practices
 * =============================================
 * This file demonstrates the recommended patterns for using AI SDK
 * in this project.
 * 
 * AI SDK v7 API Reference: https://ai-sdk.dev/docs
 */

import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// ============================================
// Example 1: Simple text generation with Gemini
// ============================================
async function exampleGeminiText() {
    const model = google("gemini-3.1-flash-lite"); // or "gemini-1.5-pro" for more complex tasks

    const result = await generateText({
        model,
        prompt: "Explain the benefits of AI SDK in Arabic",
        temperature: 0.7,
    });

    console.log("Gemini response:", result.text);
}

// ============================================
// Example 2: OpenAI-compatible API (including FreeModel)
// ============================================
async function exampleOpenAICompatibleText() {
    const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY || process.env.AI_OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || process.env.AI_OPENAI_BASE_URL,
    });

    const model = openai("gpt-5.5"); // or any compatible model

    const result = await generateText({
        model,
        prompt: "Write a simple Next.js component",
        temperature: 0.5,
    });

    console.log("OpenAI response:", result.text);
}

// ============================================
// Example 3: Structured output with Zod schema
// Note: For AI SDK v7, parse JSON manually and validate with Zod
// ============================================
async function exampleStructuredText() {
    const { z } = await import("zod");

    // Define Zod schema for type-safe responses
    const projectSchema = z.object({
        name: z.string(),
        description: z.string(),
        features: z.array(z.string()),
        techStack: z.array(z.string()),
    });

    const model = google("gemini-3.1-flash-lite");

    const result = await generateText({
        model,
        prompt: `Generate a simple todo app specification as JSON.
Return ONLY valid JSON with this exact shape:
${JSON.stringify({
            name: "string",
            description: "string",
            features: ["string"],
            techStack: ["string"]
        }, null, 2)}
Do not wrap in code fences.`,
        temperature: 0.4,
    });

    // Parse and validate the JSON response
    const parsed = projectSchema.parse(JSON.parse(result.text));
    console.log("Structured response:", parsed);
}

// ============================================
// Example 4: Streaming text generation
// ============================================
async function exampleStreamingText() {
    const model = google("gemini-3.1-flash-lite");

    const result = await streamText({
        model,
        prompt: "Write a detailed explanation about Next.js App Router",
        temperature: 0.7,
    });

    // Stream the response token by token
    for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
    }
}

// ============================================
// Example 5: Using with custom endpoint (FreeModel)
// ============================================
async function exampleCustomEndpoint() {
    // For custom OpenAI-compatible endpoints like FreeModel
    const customClient = createOpenAI({
        apiKey: process.env.AI_OPENAI_API_KEY || "",
        baseURL: process.env.AI_OPENAI_BASE_URL,
    });

    const model = customClient("gpt-5.5"); // Model name as expected by the endpoint

    const result = await generateText({
        model,
        prompt: "Hello, world!",
    });

    return result.text;
}

// ============================================
// Example 6: Multi-turn conversation
// ============================================
async function exampleMultiTurn() {
    const model = google("gemini-3.5-flash");

    const messages = [
        { role: "user" as const, content: "What is TypeScript?" },
        { role: "assistant" as const, content: "TypeScript is a superset of JavaScript..." },
        { role: "user" as const, content: "What are its benefits?" },
    ];

    const result = await generateText({
        model,
        messages,
        temperature: 0.5,
    });

    console.log("Conversation response:", result.text);
}

// ============================================
// Best Practices Summary:
// ============================================
//
// 1. Use generateText for text responses
// 2. Use streamText for real-time streaming responses
// 3. Validate JSON responses with Zod schema after parsing
// 4. Configure API keys via environment variables (never hardcode)
// 5. Use createOpenAI({ baseURL }) for compatible APIs
// 6. Always wrap AI calls in try-catch for error handling
// 7. Use temperature: 0.4-0.7 for creative tasks, 0.1-0.3 for deterministic tasks
// 8. Use "gemini-1.5-flash" for cost-effective, "gemini-1.5-pro" for complex tasks

export {
    exampleGeminiText,
    exampleOpenAICompatibleText,
    exampleStructuredText,
    exampleStreamingText,
    exampleCustomEndpoint,
    exampleMultiTurn,
};