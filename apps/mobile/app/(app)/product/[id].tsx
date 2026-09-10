import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Scissors,
  Share2,
  Tag,
  CheckCircle,
  RefreshCw,
  Eye,
  Layers,
} from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { supabase } from '../../../src/lib/supabase';
import { getApiBaseUrl } from '../../../src/lib/api';

interface MediaItem {
  id: string;
  url: string;
  mediaType: string;
  metadata?: any;
  createdAt: string;
}

interface ProductDetails {
  product: {
    id: string;
    category: string;
    status: string;
    title: string;
    shortDescription: string;
    craftType?: string;
    materials?: string;
    pricing?: {
      aiMinPrice: number;
      aiRecommendedPrice: number;
      aiPremiumPrice: number;
      currency: string;
    };
  };
  media: {
    original: MediaItem | null;
    processed: MediaItem | null;
    processedPhotos?: MediaItem[];
    marketingAssets: MediaItem[];
  };
}

export default function ProductMarketingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard: Buyers cannot access artisan studio
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace(`/(app)/buyer/product/${id}` as any);
    }
  }, [role, isLoading, id]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'processed'>('original');
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const carouselRef = React.useRef<ScrollView>(null);

  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const isFetchingRef = React.useRef(false);

  const getBaseApiUrl = () => {
    return getApiBaseUrl();
  };

  const getAccessToken = async (): Promise<string | null> => {
    const { session } = useAuthStore.getState();
    if (session?.access_token) return session.access_token;
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token || null;
  };

  const fetchProductDetails = async () => {
    if (!id || isFetchingRef.current) return;
    isFetchingRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      setLoading(true);
      const token = await getAccessToken();
      const apiUrl = `${getBaseApiUrl()}/marketing/${id}`;

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Failed to load product (status ${res.status})`);
      }

      const json: ProductDetails = await res.json();
      setData(json);

      if (json.media.processed) {
        setActiveTab('processed');
      }
    } catch (err: any) {
      console.error('Fetch product details error:', err);
      Alert.alert('Load Error', err.message || 'Could not fetch product details.');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  // Clean background trigger
  const handleCleanBackground = async () => {
    if (!id) return;

    try {
      setIsProcessingBg(true);
      const token = await getAccessToken();
      const url = `${getBaseApiUrl()}/images/${id}/process-background`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Background removal failed');
      }

      Alert.alert(
        'AI स्टूडियो एंगल तैयार! (Studio Angles Ready)',
        'Generated 4 professional studio angles (Clean Cutout, 45° Side Angle, Top-Down, and Close-Up). Swipe the carousel to inspect each view!',
      );
      await fetchProductDetails();
      setActiveTab('processed');
      setSelectedAngleIndex(0);
    } catch (err: any) {
      console.error('Background removal error:', err);
      Alert.alert('Processing Notice', err.message);
    } finally {
      setIsProcessingBg(false);
    }
  };

  // Generate Pollinations AI marketing poster trigger
  const handleGenerateMarketing = async () => {
    if (!id) return;

    try {
      setIsGeneratingMarketing(true);
      const token = await getAccessToken();
      const url = `${getBaseApiUrl()}/marketing/${id}/generate`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Poster generation failed');
      }

      Alert.alert(
        'मार्केटिंग पोस्टर तैयार! (Poster Generated)',
        'A stunning lifestyle poster has been generated via Pollinations AI.',
      );
      await fetchProductDetails();
    } catch (err: any) {
      console.error('Marketing generation error:', err);
      Alert.alert('Generation Error', err.message);
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  // Share poster via React Native native share
  const handleShare = async (assetUrl: string) => {
    try {
      const title = data?.product.title || 'Handcrafted Craft';
      const craftType = data?.product.craftType || 'Traditional Folk Art';
      const price = data?.product.pricing?.aiRecommendedPrice;

      await Share.share({
        title,
        message: `✨ Look at this authentic handmade craft: "${title}" (${craftType})!\n\n${data?.product.shortDescription || ''}\n\nPrice: ₹${price || 'Fair valuation'}\n\nPhoto link: ${assetUrl}`,
        url: assetUrl,
      });
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 bg-artisan-canvas items-center justify-center"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <ActivityIndicator size="large" color="#C85A32" />
        <Text className="mt-4 text-base font-bold text-artisan-slate">
          Loading Product Studio...
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View
        className="flex-1 bg-artisan-canvas items-center justify-center p-6"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <Text className="text-xl font-bold text-artisan-slate">
          Product Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-artisan-primary px-6 py-3"
        >
          <Text className="font-bold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { product, media } = data;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const CAROUSEL_WIDTH = Math.min(SCREEN_WIDTH - 40, 420);
  const CAROUSEL_HEIGHT = Math.round(CAROUSEL_WIDTH * 0.85);

  const studioPhotos =
    media.processedPhotos && media.processedPhotos.length > 0
      ? media.processedPhotos
      : media.processed
      ? [media.processed]
      : [];

  const getAngleBadge = (item: MediaItem, index: number) => {
    const angle = item.metadata?.angle || '';
    if (angle === 'SIDE_VIEW') return { title: '45° Side View', subtitle: '45° साइड व्यू' };
    if (angle === 'TOP_DOWN') return { title: 'Top-Down Flat Lay', subtitle: 'टॉप-डाउन व्यू' };
    if (angle === 'CLOSE_UP') return { title: 'Macro Detail Shot', subtitle: 'नजदीकी डिटेल' };
    if (angle === 'FRONT_CLEAN') return { title: 'Clean Cutout', subtitle: 'क्लीन बैकग्राउंड' };
    return { title: `Studio Angle ${index + 1}`, subtitle: `स्टूडियो एंगल ${index + 1}` };
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
          className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xl font-bold text-artisan-slate">
            Artisan Studio
          </Text>
          <Text className="text-xs font-semibold text-artisan-primary">
            मार्केटिंग और स्टूडियो हब
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchProductDetails}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
        >
          <RefreshCw color="#1E293B" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Product Photo Showcase */}
        <View className="mb-4 overflow-hidden rounded-3xl border-2 border-artisan-border bg-white shadow-sm">
          {activeTab === 'processed' ? (
            studioPhotos.length > 0 ? (
              <View>
                {/* Horizontal Swipeable Carousel */}
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={CAROUSEL_WIDTH}
                  onMomentumScrollEnd={(e) => {
                    const offsetX = e.nativeEvent.contentOffset.x;
                    const index = Math.round(offsetX / CAROUSEL_WIDTH);
                    if (index >= 0 && index < studioPhotos.length) {
                      setSelectedAngleIndex(index);
                    }
                  }}
                  style={{ width: CAROUSEL_WIDTH, height: CAROUSEL_HEIGHT }}
                >
                  {studioPhotos.map((photo, idx) => {
                    const badge = getAngleBadge(photo, idx);
                    return (
                      <View
                        key={photo.id || idx}
                        style={{ width: CAROUSEL_WIDTH, height: CAROUSEL_HEIGHT }}
                        className="relative items-center justify-center bg-slate-50"
                      >
                        <Image
                          source={{ uri: photo.url }}
                          style={{
                            width: CAROUSEL_WIDTH - 24,
                            height: CAROUSEL_HEIGHT - 24,
                          }}
                          resizeMode="contain"
                        />

                        {/* Floating Angle Badge */}
                        <View className="absolute left-3 top-3 flex-row items-center rounded-full border border-artisan-border bg-white/95 px-3 py-1.5 shadow-sm">
                          <Layers color="#C85A32" size={13} />
                          <Text className="ml-1.5 text-xs font-bold text-artisan-slate">
                            {badge.title}
                          </Text>
                        </View>

                        {/* Floating Counter Badge */}
                        <View className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1">
                          <Text className="text-[11px] font-bold text-white">
                            {idx + 1} / {studioPhotos.length}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Pagination Dots Indicator */}
                {studioPhotos.length > 1 && (
                  <View className="flex-row items-center justify-center border-t border-slate-100 bg-slate-50 py-2.5">
                    {studioPhotos.map((_, dotIdx) => (
                      <TouchableOpacity
                        key={dotIdx}
                        onPress={() => {
                          setSelectedAngleIndex(dotIdx);
                          carouselRef.current?.scrollTo({
                            x: dotIdx * CAROUSEL_WIDTH,
                            animated: true,
                          });
                        }}
                        className={`mx-1 h-2 rounded-full ${
                          selectedAngleIndex === dotIdx
                            ? 'w-6 bg-artisan-primary'
                            : 'w-2 bg-slate-300'
                        }`}
                      />
                    ))}
                  </View>
                )}

                {/* Quick Angle Selector Chips */}
                {studioPhotos.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="border-t border-slate-200 bg-slate-100/70 px-3 py-2"
                    contentContainerStyle={{ alignItems: 'center' }}
                  >
                    {studioPhotos.map((photo, chipIdx) => {
                      const badge = getAngleBadge(photo, chipIdx);
                      const isSelected = selectedAngleIndex === chipIdx;
                      return (
                        <TouchableOpacity
                          key={photo.id || chipIdx}
                          onPress={() => {
                            setSelectedAngleIndex(chipIdx);
                            carouselRef.current?.scrollTo({
                              x: chipIdx * CAROUSEL_WIDTH,
                              animated: true,
                            });
                          }}
                          className={`mr-2 flex-row items-center rounded-xl px-3 py-1.5 border ${
                            isSelected
                              ? 'border-artisan-primary bg-white shadow-sm'
                              : 'border-slate-200 bg-white/70'
                          }`}
                        >
                          <Layers
                            color={isSelected ? '#C85A32' : '#64748B'}
                            size={13}
                          />
                          <Text
                            className={`ml-1.5 text-xs font-bold ${
                              isSelected
                                ? 'text-artisan-primary'
                                : 'text-slate-600'
                            }`}
                          >
                            {badge.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View
                style={{ height: CAROUSEL_HEIGHT }}
                className="items-center justify-center bg-slate-50 p-6 text-center"
              >
                <Scissors color="#C85A32" size={36} />
                <Text className="mt-3 text-center text-sm font-bold text-artisan-slate">
                  No Studio Angles Yet
                </Text>
                <Text className="mt-1 text-center text-xs text-artisan-muted">
                  Tap &quot;AI Multi-Angle Studio&quot; below to generate 4 studio angles!
                </Text>
              </View>
            )
          ) : media.original?.url ? (
            <View
              style={{ height: CAROUSEL_HEIGHT }}
              className="relative items-center justify-center bg-slate-50"
            >
              <Image
                source={{ uri: media.original.url }}
                style={{
                  width: CAROUSEL_WIDTH - 24,
                  height: CAROUSEL_HEIGHT - 24,
                }}
                resizeMode="contain"
              />
              <View className="absolute left-3 top-3 flex-row items-center rounded-full border border-artisan-border bg-white/95 px-3 py-1.5 shadow-sm">
                <Eye color="#64748B" size={13} />
                <Text className="ml-1.5 text-xs font-bold text-artisan-slate">
                  Original Photo / मूल फोटो
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{ height: CAROUSEL_HEIGHT }}
              className="items-center justify-center bg-slate-50"
            >
              <Text className="text-artisan-muted">No Image Available</Text>
            </View>
          )}

          {/* Toggle Tab: Original vs AI Studio Angles */}
          <View className="flex-row border-t border-artisan-border bg-slate-50 p-2">
            <TouchableOpacity
              onPress={() => setActiveTab('original')}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                activeTab === 'original'
                  ? 'border border-artisan-border bg-white shadow-sm'
                  : ''
              }`}
            >
              <Eye color="#64748B" size={18} />
              <Text
                className={`ml-2 text-sm font-bold ${
                  activeTab === 'original'
                    ? 'text-artisan-slate'
                    : 'text-artisan-muted'
                }`}
              >
                Original / मूल
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (studioPhotos.length > 0) {
                  setActiveTab('processed');
                } else {
                  Alert.alert(
                    'No Studio Angles Yet',
                    'Tap "AI Multi-Angle Studio" below to generate 4 professional studio angles with Generative AI.',
                  );
                }
              }}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                activeTab === 'processed'
                  ? 'border border-artisan-primary bg-white shadow-sm'
                  : ''
              }`}
            >
              <Layers
                color={studioPhotos.length > 0 ? '#C85A32' : '#94A3B8'}
                size={18}
              />
              <Text
                className={`ml-2 text-sm font-bold ${
                  activeTab === 'processed'
                    ? 'text-artisan-primary'
                    : studioPhotos.length > 0
                    ? 'text-artisan-slate'
                    : 'text-slate-400'
                }`}
              >
                AI Studio ({studioPhotos.length}){' '}
                {studioPhotos.length > 0 ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Meta Card */}
        <View className="mb-6 rounded-3xl border border-artisan-border bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-orange-100 px-3 py-1">
              <Text className="text-xs font-bold uppercase text-artisan-primary">
                {product.craftType || product.category}
              </Text>
            </View>
            {product.pricing && (
              <View className="flex-row items-center rounded-full bg-green-100 px-3 py-1">
                <Tag color="#16A34A" size={14} />
                <Text className="ml-1 text-xs font-bold text-green-800">
                  ₹{product.pricing.aiMinPrice} - ₹{product.pricing.aiPremiumPrice}
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-3 text-2xl font-extrabold text-artisan-slate">
            {product.title}
          </Text>
          <Text className="mt-1 text-base text-artisan-muted">
            {product.shortDescription}
          </Text>

          {product.materials && (
            <Text className="mt-2 text-xs font-medium text-artisan-amber">
              Materials: {product.materials}
            </Text>
          )}
        </View>

        {/* Action Buttons with High Touch Targets (Low Digital Literacy) */}
        {studioPhotos.length === 0 || media.marketingAssets.length === 0 ? (
          <>
            <Text className="mb-3 text-lg font-bold text-artisan-slate">
              AI Enhancements / AI संवर्धन
            </Text>

            <View className="mb-8 space-y-4">
              {/* Button 1: AI Multi-Angle Studio */}
              {studioPhotos.length === 0 ? (
                <TouchableOpacity
                  onPress={handleCleanBackground}
                  disabled={isProcessingBg}
                  activeOpacity={0.85}
                  className="rounded-2xl border-2 border-artisan-primary bg-artisan-light p-4 shadow-md"
                >
                  {isProcessingBg ? (
                    <View className="flex-row items-center justify-center py-2">
                      <ActivityIndicator color="#C85A32" size="small" />
                      <View className="ml-3">
                        <Text className="text-base font-bold text-artisan-primary">
                          Generating 4 Studio Angles with AI...
                        </Text>
                        <Text className="text-xs text-artisan-primary/80">
                          Clean cutout + Side View + Top-Down + Close-Up
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                        <Layers color="#C85A32" size={24} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-extrabold text-artisan-primary">
                          AI Multi-Angle Studio / 4 नए एंगल बनाएं
                        </Text>
                        <Text className="text-xs font-semibold text-slate-600">
                          Clean Cutout + 45° Side + Top-Down + Macro Close-Up
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* Button 2: Generate Marketing Posters */}
              {media.marketingAssets.length === 0 ? (
                <TouchableOpacity
                  onPress={handleGenerateMarketing}
                  disabled={isGeneratingMarketing}
                  activeOpacity={0.85}
                  className="mt-3 h-18 flex-row items-center justify-center rounded-2xl bg-artisan-amber shadow-lg shadow-artisan-amber/30"
                >
                  {isGeneratingMarketing ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text className="ml-3 text-lg font-bold text-white">
                        Creating 4K Poster with AI...
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Sparkles color="#FFFFFF" size={26} />
                      <Text className="ml-3 text-xl font-extrabold text-white">
                        Generate Posters / पोस्टर बनाएं
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Marketing Posters Showcase */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-artisan-slate">
            Lifestyle Posters / विपणन पोस्टर
          </Text>
          <View className="rounded-full bg-slate-100 px-3 py-1">
            <Text className="text-xs font-bold text-artisan-slate">
              {media.marketingAssets.length} Generated
            </Text>
          </View>
        </View>

        {media.marketingAssets.length === 0 ? (
          <View className="rounded-3xl border-2 border-dashed border-artisan-border bg-white p-8 items-center justify-center">
            <Sparkles color="#E58A13" size={40} />
            <Text className="mt-3 text-center text-lg font-bold text-artisan-slate">
              No Posters Generated Yet
            </Text>
            <Text className="mt-1 text-center text-sm text-artisan-muted">
              Tap "Generate Posters" above to create professional AI lifestyle scenes for WhatsApp & social media.
            </Text>
          </View>
        ) : (
          <View className="space-y-6">
            {media.marketingAssets.map((asset, index) => (
              <View
                key={asset.id || index}
                className="overflow-hidden rounded-3xl border border-artisan-border bg-white shadow-sm mb-5"
              >
                <Image
                  source={{ uri: asset.url }}
                  className="h-80 w-full"
                  resizeMode="cover"
                />

                <View className="p-4 bg-white">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <CheckCircle color="#16A34A" size={16} />
                      <Text className="ml-1.5 text-xs font-semibold text-slate-600">
                        4K Lifestyle Poster • Pollinations AI
                      </Text>
                    </View>
                  </View>

                  {/* WhatsApp / Social Share Button */}
                  <TouchableOpacity
                    onPress={() => handleShare(asset.url)}
                    activeOpacity={0.85}
                    className="mt-3 h-14 flex-row items-center justify-center rounded-xl bg-green-600 shadow-md shadow-green-600/30"
                  >
                    <Share2 color="#FFFFFF" size={22} />
                    <Text className="ml-2.5 text-lg font-bold text-white">
                      Share on WhatsApp / शेयर करें
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
