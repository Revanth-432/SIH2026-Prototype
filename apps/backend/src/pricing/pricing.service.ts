import { Injectable, Logger } from '@nestjs/common';

export interface CalculatedPricing {
  aiMinPrice: number;
  aiRecommendedPrice: number;
  aiPremiumPrice: number;
  pricingExplanation: string;
  currency: string;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  /**
   * Parse an AI-suggested price range (e.g. "₹450 - ₹650", "500 - 800", "₹700")
   * into structured minimum, recommended, and premium pricing points.
   */
  calculateFromAiRange(suggestedRange?: string): CalculatedPricing {
    const currency = 'INR';

    if (!suggestedRange) {
      return {
        aiMinPrice: 350,
        aiRecommendedPrice: 500,
        aiPremiumPrice: 750,
        pricingExplanation: 'Baseline estimate generated using standard handicraft craft material benchmarks.',
        currency,
      };
    }

    // Extract all numbers from the string (ignoring currency symbols)
    const matches = suggestedRange.replace(/,/g, '').match(/\d+(\.\d+)?/g);

    if (matches && matches.length >= 2) {
      const min = Math.round(parseFloat(matches[0]!));
      const max = Math.round(parseFloat(matches[1]!));
      const recommended = Math.round((min + max) / 2);

      this.logger.log(`Parsed price range: [${min}, ${max}], recommended: ${recommended}`);

      return {
        aiMinPrice: min,
        aiRecommendedPrice: recommended,
        aiPremiumPrice: max,
        pricingExplanation: `AI suggested fair artisan valuation based on craft complexity and raw materials. Min: ₹${min}, Fair: ₹${recommended}, Premium: ₹${max}.`,
        currency,
      };
    } else if (matches && matches.length === 1) {
      const base = Math.round(parseFloat(matches[0]!));
      const min = Math.round(base * 0.85);
      const max = Math.round(base * 1.25);

      return {
        aiMinPrice: min,
        aiRecommendedPrice: base,
        aiPremiumPrice: max,
        pricingExplanation: `Valuation derived from base estimation of ₹${base}.`,
        currency,
      };
    }

    // Fallback if parsing fails
    return {
      aiMinPrice: 400,
      aiRecommendedPrice: 550,
      aiPremiumPrice: 750,
      pricingExplanation: `Default standard valuation for traditional handcrafted item (${suggestedRange}).`,
      currency,
    };
  }
}
