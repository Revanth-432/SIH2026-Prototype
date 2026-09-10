import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, AlertCircle, RotateCcw, Edit3 } from 'lucide-react-native';
import { useDraftStore } from '../../../src/store/useDraftStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { generateProductCatalog } from '../../../src/lib/gemini';

export default function ProcessingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  const { imageUri, audioUri, setAiGeneratedData } = useDraftStore();

  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    {
      en: 'Analyzing Craft Photo & Textures...',
      hi: 'शिल्प की फोटो और बनावट का विश्लेषण...',
    },
    {
      en: 'Listening to your Voice Story...',
      hi: 'आपकी आवाज़ और कहानी को समझ रहे हैं...',
    },
    {
      en: 'Extracting Materials & Craft Heritage...',
      hi: 'पारंपरिक कला और सामग्री की पहचान...',
    },
    {
      en: 'Calculating Smart Fair Pricing...',
      hi: 'उचित बाज़ार मूल्य और विवरण तैयार...',
    },
  ];

  const processMediaWithAI = async () => {
    if (!imageUri) {
      router.replace('/(app)/capture/image');
      return;
    }

    try {
      setError(null);
      setLoadingStep(0);

      const stepInterval = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1800);

      const catalogData = await generateProductCatalog(imageUri, audioUri);
      clearInterval(stepInterval);

      setAiGeneratedData(catalogData);
      router.replace('/(app)/capture/review');
    } catch (err: any) {
      console.error('AI processing error:', err);
      setError(
        err.message ||
          'Could not analyze craft with AI. Please check your internet or retry.',
      );
    }
  };

  useEffect(() => {
    processMediaWithAI();
  }, [imageUri, audioUri]);

  const handleManualFallback = () => {
    // Provide a default template so the artisan can fill the review form directly
    setAiGeneratedData({
      title: 'Handmade Craft',
      category: 'Traditional Crafts',
      shortDescription: 'Handcrafted piece made with traditional methods.',
      materials: ['Handmade Materials'],
      craftType: 'Traditional Art',
      suggestedPriceRange: '₹500 - ₹800',
    });
    router.replace('/(app)/capture/review');
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      <View className="flex-1 items-center justify-center px-8">
        {!error ? (
          <>
            {/* Friendly Warm AI Pulsing Badge */}
            <View className="mb-8 h-28 w-28 items-center justify-center rounded-3xl bg-artisan-primary shadow-2xl shadow-artisan-primary/40">
              <Sparkles color="#FFFFFF" size={60} />
            </View>

            <Text className="text-3xl font-extrabold text-artisan-slate text-center">
              Kala AI Studio
            </Text>
            <Text className="mt-1 text-lg font-bold text-artisan-primary text-center">
              कला संगम AI विश्लेषण
            </Text>

            <ActivityIndicator
              size="large"
              color="#C85A32"
              style={{ marginVertical: 32 }}
            />

            {/* Step Progress Message */}
            <View className="rounded-2xl bg-white p-6 border border-artisan-border w-full shadow-sm">
              <Text className="text-center text-lg font-bold text-artisan-slate">
                {steps[loadingStep]?.en}
              </Text>
              <Text className="mt-2 text-center text-base font-medium text-artisan-amber">
                {steps[loadingStep]?.hi}
              </Text>
            </View>

            <Text className="mt-8 text-center text-sm text-artisan-muted">
              Please wait a moment while Gemini creates your smart catalog card...
            </Text>
          </>
        ) : (
          /* Error & Fallback View */
          <View className="w-full rounded-3xl bg-white p-6 border-2 border-red-200 shadow-md items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle color="#DC2626" size={36} />
            </View>

            <Text className="text-2xl font-bold text-artisan-slate text-center">
              AI Analysis Notice
            </Text>
            <Text className="mt-1 text-sm font-semibold text-artisan-error text-center">
              विश्लेषण में समस्या आई
            </Text>

            <Text className="mt-4 text-center text-base text-artisan-muted">
              {error}
            </Text>

            <View className="mt-6 w-full space-y-3">
              {/* Retry Button */}
              <TouchableOpacity
                key="btn-retry-ai"
                onPress={processMediaWithAI}
                className="h-16 flex-row items-center justify-center rounded-2xl bg-artisan-primary"
              >
                <RotateCcw color="#FFFFFF" size={24} />
                <Text className="ml-3 text-xl font-bold text-white">
                  Retry / पुनः प्रयास करें
                </Text>
              </TouchableOpacity>

              {/* Manual Entry Fallback */}
              <TouchableOpacity
                key="btn-manual-fallback"
                onPress={handleManualFallback}
                className="mt-3 h-16 flex-row items-center justify-center rounded-2xl border-2 border-artisan-border bg-white"
              >
                <Edit3 color="#1E293B" size={24} />
                <Text className="ml-3 text-lg font-bold text-artisan-slate">
                  Enter Details Manually / खुद भरें
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
