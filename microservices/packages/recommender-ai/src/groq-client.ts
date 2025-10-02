import Groq from 'groq-sdk';
import { createLogger } from '@lunch/logger';
import type { Ingredient } from '@lunch/shared-kernel';

const log = createLogger('groq-client');

export interface GroqConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
}

export interface PredictionAnalysisInput {
  ingredient: Ingredient;
  currentStock: number;
  averageConsumptionRate: number;
  standardDeviation: number;
  totalOrders: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendStrength: number;
  forecastNext24Hours: number;
  hoursUntilShortage: number | null;
}

export interface AIAnalysisResult {
  prediction: string;
  reasoning: string;
  recommendations: string[];
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class GroqClient {
  private config: Required<Omit<GroqConfig, 'enabled'>> & { enabled: boolean };
  private client: Groq | null = null;
  private requestCount = 0;

  constructor(config: GroqConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model ?? 'llama3-70b-8192',
      maxTokens: config.maxTokens ?? 500,
      temperature: config.temperature ?? 0.3,
      enabled: config.enabled ?? true,
    };

    if (this.config.enabled && !this.config.apiKey) {
      log.warn('Groq API key not provided, AI analysis will be disabled');
      this.config.enabled = false;
    } else if (this.config.enabled && this.config.apiKey) {
      try {
        this.client = new Groq({
          apiKey: this.config.apiKey,
        });
        log.info(
          {
            model: this.config.model,
            enabled: true,
            tier: 'FREE',
          },
          '✅ Groq client initialized (Llama 3 70B - FREE TIER)',
        );
      } catch (error) {
        log.error({ error }, 'Failed to initialize Groq client');
        this.config.enabled = false;
      }
    }
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.client;
  }

  async analyzePrediction(input: PredictionAnalysisInput): Promise<AIAnalysisResult> {
    if (!this.isEnabled() || !this.client) {
      throw new Error('Groq client is not enabled or API key is missing');
    }

    const prompt = this.buildPredictionPrompt(input);

    try {
      log.debug({ ingredient: input.ingredient }, 'Requesting Groq analysis (FREE)');
      this.requestCount++;

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI analyst for restaurant inventory management. 
                    Your task is to analyze ingredient consumption data and provide actionable predictions about potential shortages.
                    Always respond in valid JSON format with the following structure:
                    {
                      "prediction": "brief prediction summary",
                      "reasoning": "detailed analysis of the data",
                      "recommendations": ["recommendation 1", "recommendation 2"],
                      "confidence": 85,
                      "riskLevel": "high"
                    }

                    Risk levels: low, medium, high, critical
                    Confidence: 0-100`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in Groq response');
      }

      const parsed = JSON.parse(content);

      log.info(
        {
          ingredient: input.ingredient,
          riskLevel: parsed.riskLevel,
          requestCount: this.requestCount,
          cost: 'FREE',
        },
        '✅ Groq analysis completed (FREE)',
      );

      return {
        prediction: parsed.prediction || 'No prediction available',
        reasoning: parsed.reasoning || 'No reasoning provided',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
        riskLevel: this.validateRiskLevel(parsed.riskLevel),
      };
    } catch (error) {
      log.error({ error, ingredient: input.ingredient }, 'Groq analysis failed');
      throw error;
    }
  }

  async analyzeCriticalOnly(
    inputs: PredictionAnalysisInput[],
  ): Promise<Map<Ingredient, AIAnalysisResult>> {
    if (!this.isEnabled()) {
      log.warn('Groq client disabled, skipping AI analysis');
      return new Map();
    }

    const results = new Map<Ingredient, AIAnalysisResult>();

    const criticalInputs = inputs.filter(
      (input) =>
        input.hoursUntilShortage !== null &&
        input.hoursUntilShortage > 0 &&
        input.hoursUntilShortage <= 6,
    );

    if (criticalInputs.length === 0) {
      log.info('No critical ingredients detected, skipping Groq analysis');
      return results;
    }

    log.info(
      { count: criticalInputs.length, total: inputs.length },
      'Analyzing critical ingredients only (FREE)',
    );

    for (const input of criticalInputs) {
      try {
        const result = await this.analyzePrediction(input);
        results.set(input.ingredient, result);

        // Delay para respetar rate limits (30 requests/min = 2 segundos entre requests)
        await new Promise((resolve) => setTimeout(resolve, 2100));
      } catch (error) {
        log.error({ error, ingredient: input.ingredient }, 'Failed to analyze ingredient');
      }
    }

    return results;
  }

  private buildPredictionPrompt(input: PredictionAnalysisInput): string {
    return `Analyze the following ingredient consumption data for a FREE LUNCH DONATION event with HIGH DEMAND:

            Ingredient: ${input.ingredient}
            Current Stock: ${input.currentStock} units
            Average Consumption Rate: ${input.averageConsumptionRate.toFixed(2)} units/hour
            Standard Deviation: ${input.standardDeviation.toFixed(2)}
            Total Orders Analyzed: ${input.totalOrders}
            Consumption Trend: ${input.trend} (strength: ${(input.trendStrength * 100).toFixed(0)}%)
            Forecast Next 24h: ${input.forecastNext24Hours.toFixed(1)} units
            Hours Until Shortage: ${input.hoursUntilShortage?.toFixed(1) ?? 'N/A'}

            Context: This is a massive donation event where hundreds or thousands of dishes can be ordered simultaneously. Stock depletion happens quickly.

            Based on this data:
            1. Predict if and when shortage will occur (consider high-demand scenario)
            2. Explain your reasoning considering trends, variability, and the high-volume context
            3. Provide 2-3 specific, actionable recommendations for the restaurant manager
            4. Assess confidence level (0-100) and risk level (low/medium/high/critical)

            Respond in JSON format.`;
  }

  private validateRiskLevel(level: any): 'low' | 'medium' | 'high' | 'critical' {
    const valid = ['low', 'medium', 'high', 'critical'];
    return valid.includes(level) ? level : 'medium';
  }

  getUsageStats(): { requestCount: number; model: string; enabled: boolean; cost: string } {
    return {
      requestCount: this.requestCount,
      model: this.config.model,
      enabled: this.config.enabled,
      cost: 'FREE (Groq - Llama 3 70B)',
    };
  }
}
