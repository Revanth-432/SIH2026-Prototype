import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import { ProductCatalogData } from '../store/useDraftStore';

const apiKey =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  '';

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Helper to determine MIME type from a file URI
 */
function getMimeType(uri: string, defaultType: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'mp3':
      return 'audio/mp3';
    case 'wav':
      return 'audio/wav';
    case 'caf':
      return 'audio/x-caf';
    case 'aac':
      return 'audio/aac';
    default:
      return defaultType;
  }
}

/**
 * Multimodal AI function to generate structured product catalog data
 * from an artisan's craft photo and optional spoken voice note.
 */
export async function generateProductCatalog(
  imageUri: string,
  audioUri?: string | null,
): Promise<ProductCatalogData> {
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new Error(
      'Gemini API Key is missing. Please configure EXPO_PUBLIC_GEMINI_API_KEY in apps/mobile/.env.',
    );
  }

  // 1. Convert image to base64
  const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const imageMimeType = getMimeType(imageUri, 'image/jpeg');

  const contents: any[] = [
    {
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    },
  ];

  // 2. Convert voice note to base64 if available
  if (audioUri) {
    try {
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const audioMimeType = getMimeType(audioUri, 'audio/mp4');

      contents.push({
        inlineData: {
          data: audioBase64,
          mimeType: audioMimeType,
        },
      });
    } catch (audioErr) {
      console.warn('Could not read audio file for Gemini, proceeding with image only:', audioErr);
    }
  }

  // 3. Prompt for cultural and structured cataloging
  const prompt = `
You are an expert specialist in Indian traditional crafts, folk art, handloom, and market cataloging for marginalized artisans.
Analyze the attached craft photograph and the artisan's spoken voice note (which may be in Hindi, a regional Indian language, or English).

Extract structured product cataloging details adhering strictly to this JSON format:
{
  "title": "An attractive, authentic product title (e.g. 'Handcrafted Terracotta Diya with Madhubani Motifs')",
  "category": "Primary catalog category (e.g. 'Pottery & Ceramics', 'Textiles & Handloom', 'Folk Paintings', 'Woodwork', 'Jewelry', 'Home Decor')",
  "shortDescription": "An authentic, evocative 2-3 sentence description highlighting the craft technique, aesthetic, and cultural heritage.",
  "materials": ["Array", "of", "materials", "used", "like 'Clay', 'Natural Mineral Pigments'"],
  "craftType": "Specific traditional craft name (e.g. 'Terracotta Clay Art', 'Madhubani / Mithila Painting', 'Dokra Metal Craft')",
  "suggestedPriceRange": "Fair market price range in Indian Rupees (e.g. '₹450 - ₹650')"
}

Ensure all fields are present, accurate to traditional Indian craftsmanship, and format strictly as a JSON object.
`.trim();

  contents.push(prompt);

  // 4. Try candidate models in order of capability and availability
  const CANDIDATE_MODELS = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
  ];

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const response = await model.generateContent(contents);
      const textResponse = response.response.text();

      // Strip markdown fences if present
      let cleanText = textResponse.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      const parsed: ProductCatalogData = JSON.parse(cleanText);
      return {
        title: parsed.title || 'Handcrafted Artisan Craft',
        category: parsed.category || 'Traditional Crafts',
        shortDescription: parsed.shortDescription || 'Authentic handmade craft piece.',
        materials: Array.isArray(parsed.materials) ? parsed.materials : ['Natural Materials'],
        craftType: parsed.craftType || 'Traditional Craft',
        suggestedPriceRange: parsed.suggestedPriceRange || '₹500 - ₹800',
      };
    } catch (err: any) {
      console.warn(`Model ${modelName} failed or unavailable, trying fallback:`, err.message);
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message || 'Could not analyze craft with AI. Please retry or enter details manually.',
  );
}
