import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import {
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  DollarSign,
  Palette,
  ArrowLeft,
  UploadCloud,
  Package,
} from 'lucide-react-native';

import { useDraftStore } from '../../../src/store/useDraftStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { supabase } from '../../../src/lib/supabase';
import { getApiBaseUrl } from '../../../src/lib/api';

interface ReviewFormData {
  title: string;
  category: string;
  craftType: string;
  shortDescription: string;
  materials: string;
  suggestedPriceRange: string;
  maxOrderLimit: string;
}

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  const { imageUri, audioUri, aiGeneratedData, resetDraft } = useDraftStore();
  const [loadingState, setLoadingState] = useState<'idle' | 'publishing' | 'angles' | 'posters'>('idle');

  const { control, handleSubmit } = useForm<ReviewFormData>({
    defaultValues: {
      title: aiGeneratedData?.title || 'Handcrafted Craft Piece',
      category: aiGeneratedData?.category || 'Traditional Crafts',
      craftType: aiGeneratedData?.craftType || 'Folk Art',
      shortDescription:
        aiGeneratedData?.shortDescription ||
        'Handmade by traditional artisans with heritage techniques.',
      materials:
        aiGeneratedData?.materials?.join(', ') || 'Natural Materials, Pigments',
      suggestedPriceRange: aiGeneratedData?.suggestedPriceRange || '₹450 - ₹750',
      maxOrderLimit: '10',
    },
  });

  const publishDraftPhase = async (data: ReviewFormData): Promise<string> => {
    if (!imageUri) throw new Error('Product photo is missing.');

    const { session } = useAuthStore.getState();
    let accessToken = session?.access_token;
    if (!accessToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData.session?.access_token;
    }

    if (!accessToken) {
      router.replace('/(auth)/login');
      throw new Error('Authentication Required');
    }

    const formData = new FormData();
    const imageFilename = imageUri.split('/').pop() || 'craft_photo.jpg';
    const imageExt = imageFilename.split('.').pop()?.toLowerCase() || 'jpg';
    const imageMime = imageExt === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('image', {
      uri: imageUri,
      name: imageFilename,
      type: imageMime,
    } as any);

    if (audioUri) {
      const audioFilename = audioUri.split('/').pop() || 'craft_voice.m4a';
      const audioExt = audioFilename.split('.').pop()?.toLowerCase() || 'm4a';
      const audioMime =
        audioExt === 'mp3' ? 'audio/mp3' : audioExt === 'wav' ? 'audio/wav' : 'audio/mp4';
      formData.append('audio', {
        uri: audioUri,
        name: audioFilename,
        type: audioMime,
      } as any);
    }

    const catalogPayload = {
      title: data.title.trim(),
      category: data.category.trim(),
      craftType: data.craftType.trim(),
      shortDescription: data.shortDescription.trim(),
      materials: data.materials.split(',').map((m) => m.trim()).filter(Boolean),
      suggestedPriceRange: data.suggestedPriceRange.trim(),
      maxOrderLimit: parseInt(data.maxOrderLimit || '10', 10) || 10,
    };
    formData.append('payload', JSON.stringify(catalogPayload));

    const publishEndpoint = `${getApiBaseUrl()}/catalog/smart-publish`;
    const response = await fetch(publishEndpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.message || 'Failed to publish craft');

    return responseData.id || responseData.product?.id;
  };

  const handleBasicPublish = async (data: ReviewFormData) => {
    try {
      setLoadingState('publishing');
      await publishDraftPhase(data);
      Alert.alert(
        'सफलतापूर्वक प्रकाशित! (Published Successfully)',
        `"${data.title}" has been saved to your catalog and uploaded to cloud storage.\n\nStatus: In Review`,
        [
          {
            text: 'Return to Hub / मुख्य पृष्ठ',
            onPress: () => {
              resetDraft();
              router.replace('/(app)/dashboard');
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('प्रकाशन त्रुटि (Publish Error)', err.message);
    } finally {
      setLoadingState('idle');
    }
  };

  const handleGenerateAngles = async (data: ReviewFormData) => {
    try {
      setLoadingState('angles');
      const productId = await publishDraftPhase(data);
      
      const { session } = useAuthStore.getState();
      await fetch(`${getApiBaseUrl()}/images/${productId}/process-background`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      resetDraft();
      router.replace(`/(app)/product/${productId}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setLoadingState('idle');
    }
  };

  const handleGeneratePosters = async (data: ReviewFormData) => {
    try {
      setLoadingState('posters');
      const productId = await publishDraftPhase(data);
      
      const { session } = useAuthStore.getState();
      await fetch(`${getApiBaseUrl()}/marketing/${productId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      resetDraft();
      router.replace(`/(app)/product/${productId}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setLoadingState('idle');
    }
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-artisan-border bg-white px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loadingState !== 'idle'}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xl font-bold text-artisan-slate">
            Step 3 of 3: Review
          </Text>
          <Text className="text-xs font-semibold text-artisan-primary">
            कदम 3: कैटलॉग की जांच और सुधार
          </Text>
        </View>
        <View className="w-12" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Craft Preview Card with AI Tag */}
        <View className="mb-6 overflow-hidden rounded-3xl border border-artisan-border bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="h-28 w-28 rounded-2xl border border-artisan-border"
                resizeMode="cover"
              />
            ) : (
              <View className="h-28 w-28 items-center justify-center rounded-2xl bg-slate-100">
                <Palette color="#64748B" size={32} />
              </View>
            )}
            <View className="ml-4 flex-1">
              <View className="flex-row items-center rounded-full bg-orange-50 px-3 py-1 self-start border border-orange-200">
                <Sparkles color="#C85A32" size={14} />
                <Text className="ml-1 text-xs font-bold text-artisan-primary">
                  AI Smart Extracted
                </Text>
              </View>
              <Text className="mt-2 text-xs text-artisan-muted">
                You can review or edit any details below before saving.
              </Text>
              <Text className="text-xs font-medium text-artisan-amber">
                नीचे दिए गए विवरण जांचें या बदलें।
              </Text>
            </View>
          </View>
        </View>

        {/* Form Fields using react-hook-form */}
        <View className="space-y-4">
          {/* 1. Title */}
          <View>
            <Text className="mb-1.5 text-base font-bold text-artisan-slate">
              Product Title / उत्पाद का नाम
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Title of your craft"
                    className="flex-1 text-lg font-bold text-artisan-slate"
                  />
                </View>
              )}
            />
          </View>

          {/* 2. Craft Type */}
          <View className="mt-4">
            <Text className="mb-1.5 text-base font-bold text-artisan-slate">
              Craft Type / पारंपरिक कला का नाम
            </Text>
            <Controller
              control={control}
              name="craftType"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                  <Palette color="#C85A32" size={22} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Madhubani Painting"
                    className="ml-3 flex-1 text-base font-medium text-artisan-slate"
                  />
                </View>
              )}
            />
          </View>

          {/* 3. Category */}
          <View className="mt-4">
            <Text className="mb-1.5 text-base font-bold text-artisan-slate">
              Category / श्रेणी
            </Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                  <Layers color="#E58A13" size={22} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Pottery, Painting"
                    className="ml-3 flex-1 text-base font-medium text-artisan-slate"
                  />
                </View>
              )}
            />
          </View>

          {/* 4. Short Description & Story */}
          <View className="mt-4">
            <Text className="mb-1.5 text-base font-bold text-artisan-slate">
              Story & Description / विवरण व कहानी
            </Text>
            <Controller
              control={control}
              name="shortDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="rounded-2xl border-2 border-artisan-border bg-white p-4">
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="Describe your craft..."
                    className="min-h-[96px] text-base font-medium text-artisan-slate"
                  />
                </View>
              )}
            />
          </View>

          {/* 5. Materials */}
          <View className="mt-4">
            <Text className="mb-1.5 text-base font-bold text-artisan-slate">
              Materials Used / प्रयुक्त सामग्री
            </Text>
            <Controller
              control={control}
              name="materials"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                  <FileText color="#64748B" size={22} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Clay, Cotton, Natural Dyes"
                    className="ml-3 flex-1 text-base font-medium text-artisan-slate"
                  />
                </View>
              )}
            />
          </View>

          {/* 6. AI Recommended Price Range */}
          <View className="mt-4">
            <Text className="mb-1.5 text-base font-bold text-artisan-slate">
              AI Suggested Price / उचित बाज़ार मूल्य
            </Text>
            <Controller
              control={control}
              name="suggestedPriceRange"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="h-16 flex-row items-center rounded-2xl border-2 border-green-300 bg-green-50/50 px-4">
                  <DollarSign color="#16A34A" size={24} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="₹500 - ₹800"
                    className="ml-2 flex-1 text-lg font-bold text-green-800"
                  />
                </View>
              )}
            />
          </View>

          {/* 7. Max Order Limit */}
          <View className="mt-4">
            <Text className="mb-0.5 text-base font-bold text-artisan-slate">
              Max Order Limit / अधिकतम ऑर्डर सीमा
            </Text>
            <Text className="mb-2 text-xs text-artisan-muted font-medium">
              Maximum items a single buyer can order • एक खरीदार अधिकतम कितने पीस खरीद सकता है
            </Text>
            <Controller
              control={control}
              name="maxOrderLimit"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="h-16 flex-row items-center rounded-2xl border-2 border-orange-300 bg-orange-50/50 px-4">
                  <Package color="#C85A32" size={24} />
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    placeholder="10"
                    className="ml-2.5 flex-1 text-lg font-bold text-artisan-slate"
                  />
                  <Text className="text-xs font-bold text-artisan-muted">
                    units / पीस
                  </Text>
                </View>
              )}
            />
          </View>

          {/* AI Enhancements & Publish Section */}
          <View className="mt-8 pt-6 border-t border-artisan-border">
            <Text className="text-xl font-extrabold text-artisan-slate mb-4">
              AI Enhancements / AI संवर्धन
            </Text>

            <TouchableOpacity
              onPress={handleSubmit(handleGenerateAngles)}
              disabled={loadingState !== 'idle'}
              activeOpacity={0.85}
              className="mb-4 flex-row items-center justify-between rounded-2xl bg-indigo-600 px-5 py-4 shadow-sm"
            >
              <View className="flex-row items-center flex-1">
                <Layers color="#FFFFFF" size={24} />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-white">
                    {loadingState === 'angles' ? 'Generating AI Images...' : 'AI Multi-Angle Studio'}
                  </Text>
                  <Text className="text-sm font-medium text-indigo-100">
                    {loadingState === 'angles' ? 'AI चित्र बन रहे हैं...' : '4 नए एंगल बनाएं'}
                  </Text>
                </View>
              </View>
              {loadingState === 'angles' && <ActivityIndicator color="#FFFFFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(handleGeneratePosters)}
              disabled={loadingState !== 'idle'}
              activeOpacity={0.85}
              className="mb-4 flex-row items-center justify-between rounded-2xl bg-fuchsia-600 px-5 py-4 shadow-sm"
            >
              <View className="flex-row items-center flex-1">
                <Sparkles color="#FFFFFF" size={24} />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-white">
                    {loadingState === 'posters' ? 'Generating AI Posters...' : 'Generate Posters'}
                  </Text>
                  <Text className="text-sm font-medium text-fuchsia-100">
                    {loadingState === 'posters' ? 'AI पोस्टर बन रहे हैं...' : 'पोस्टर बनाएं'}
                  </Text>
                </View>
              </View>
              {loadingState === 'posters' && <ActivityIndicator color="#FFFFFF" />}
            </TouchableOpacity>

            <View className="flex-row items-center my-2">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">or</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <TouchableOpacity
              onPress={handleSubmit(handleBasicPublish)}
              disabled={loadingState !== 'idle'}
              activeOpacity={0.85}
              className="mt-4 flex-row items-center justify-between rounded-2xl bg-artisan-primary px-5 py-4 shadow-sm"
            >
              <View className="flex-row items-center flex-1">
                <UploadCloud color="#FFFFFF" size={24} />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-white">
                    {loadingState === 'publishing' ? 'Publishing Craft...' : 'Save Basic Catalog'}
                  </Text>
                  <Text className="text-sm font-medium text-orange-100">
                    {loadingState === 'publishing' ? 'प्रकाशित हो रहा है...' : 'केवल विवरण सेव करें'}
                  </Text>
                </View>
              </View>
              {loadingState === 'publishing' && <ActivityIndicator color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
