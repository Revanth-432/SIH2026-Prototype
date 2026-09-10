import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../../src/store/useAuthStore';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Sparkles,
  MessageCircle,
  Phone,
  ShieldCheck,
  Tag,
  Clock,
  Palette,
  ShoppingBag,
  Layers,
  Heart,
  Building2,
} from 'lucide-react-native';
import { getApiBaseUrl } from '../../../../src/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  story?: string | null;
  category: string;
  craftType?: string | null;
  material?: string | null;
  culturalOrigin?: string | null;
  pattern?: string | null;
  colorPalette?: string[];
  pricing: {
    recommendedPrice?: number | null;
    currency: string;
    labourHours?: number | null;
    labourCost?: number | null;
    materialCost?: number | null;
  };
  media: {
    thumbnail: string | null;
    processedPhotoUrl: string | null;
    processedPhotos?: Array<{ id: string; url: string; mediaType?: string; metadata?: any }>;
    originalPhotoUrl: string | null;
    marketingAssets: Array<{ id: string; url: string }>;
    all: Array<{ id: string; url: string; mediaType: string }>;
  };
  artisan: {
    id: string;
    name: string;
    businessName?: string | null;
    bio?: string | null;
    region?: string | null;
    state?: string | null;
    craftType?: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
  };
}

export default function BuyerProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();
  const isFetchingRef = React.useRef(false);

  // Role Protection Guard: If an artisan ever opens buyer product view, send to Artisan Studio
  useEffect(() => {
    if (!isLoading && role === 'ARTISAN') {
      router.replace(`/(app)/product/${id}` as any);
    }
  }, [role, isLoading, id]);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const getBaseApiUrl = () => {
    return getApiBaseUrl();
  };

  useEffect(() => {
    if (!id || isFetchingRef.current) return;
    isFetchingRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${getBaseApiUrl()}/marketplace/${id}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data: ProductDetail = await res.json();
          setProduct(data);
        } else {
          Alert.alert('Notice', 'Could not load craft details.');
        }
      } catch (err) {
        console.warn('Failed to fetch product details:', err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchProduct();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [id]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Look at this authentic handmade craft: ${product.title} by ${product.artisan?.name || 'Traditional Artisan'}! Supporting Indian traditional artisans.`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleContactWhatsApp = () => {
    if (!product) return;
    const phone = product.artisan?.phone || '+919876543210';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `Namaste! I saw your handcrafted "${product.title}" on the KalaSangam platform. I would like to inquire about ordering.`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback to web WhatsApp or Phone dialer
          return Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
        }
      })
      .catch(() => {
        Alert.alert('Contact Artisan', `Artisan Phone: ${phone}`);
      });
  };

  const handleCallArtisan = () => {
    if (!product) return;
    const phone = product.artisan?.phone || '+919876543210';
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-artisan-canvas"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <ActivityIndicator size="large" color="#C85A32" />
        <Text className="mt-4 text-base font-bold text-artisan-slate">
          Loading Artisan Craft...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        className="flex-1 items-center justify-center bg-artisan-canvas p-6"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <ShoppingBag color="#C85A32" size={48} />
        <Text className="mt-4 text-xl font-bold text-artisan-slate">
          Craft Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-artisan-primary px-6 py-3"
        >
          <Text className="text-base font-bold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Aggregate images for gallery view: Processed Studio -> Marketing AI -> Original
  const galleryImages: Array<{ url: string; label: string; tag: string }> = [];
  const uniqueUrls = new Set<string>();

  const addImageToGallery = (url: string | null | undefined, label: string, tag: string) => {
    if (!url || uniqueUrls.has(url)) return;
    uniqueUrls.add(url);
    galleryImages.push({ url, label, tag });
  };

  if (product.media.processedPhotos && product.media.processedPhotos.length > 0) {
    product.media.processedPhotos.forEach((photo, idx) => {
      const angle = photo.metadata?.angle || '';
      let label = `Studio Angle ${idx + 1}`;
      let tag = 'Studio Shot';
      if (angle === 'SIDE_VIEW') {
        label = '45° Side View';
        tag = 'Studio Perspective';
      } else if (angle === 'TOP_DOWN') {
        label = 'Top-Down Flat Lay';
        tag = 'Overhead View';
      } else if (angle === 'CLOSE_UP') {
        label = 'Macro Detail';
        tag = 'Handcraft Texture';
      } else if (angle === 'FRONT_CLEAN') {
        label = 'Clean Studio';
        tag = 'Studio Cutout';
      }
      addImageToGallery(photo.url, label, tag);
    });
  } else if (product.media.processedPhotoUrl) {
    addImageToGallery(product.media.processedPhotoUrl, 'Studio Cleaned', 'Background Removed');
  }

  product.media.marketingAssets.forEach((asset, idx) => {
    addImageToGallery(asset.url, `AI Scene ${idx + 1}`, 'Lifestyle Poster');
  });

  if (product.media.originalPhotoUrl) {
    addImageToGallery(product.media.originalPhotoUrl, 'Original Photo', 'Authentic Workshop');
  }

  // Fallback if none of the above are categorized
  if (galleryImages.length === 0 && product.media.thumbnail) {
    addImageToGallery(product.media.thumbnail, 'Craft View', 'Handmade Item');
  }

  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0];

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between border-b border-artisan-border bg-white px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"
        >
          <ArrowLeft color="#1E293B" size={22} />
        </TouchableOpacity>

        <Text
          className="mx-2 flex-1 text-center text-base font-extrabold text-artisan-slate"
          numberOfLines={1}
        >
          {product.title}
        </Text>

        <TouchableOpacity
          onPress={handleShare}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"
        >
          <Share2 color="#64748B" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        {/* Gallery Image Display */}
        <View className="relative w-full bg-slate-900" style={{ height: SCREEN_WIDTH * 0.9 }}>
          {activeImage ? (
            <Image
              source={{ uri: activeImage.url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-orange-50">
              <ShoppingBag color="#C85A32" size={64} />
            </View>
          )}

          {/* Active Image Tag */}
          {Boolean(activeImage?.tag) ? (
            <View className="absolute top-4 left-4 rounded-full bg-slate-900/80 px-3 py-1.5 flex-row items-center">
              <Sparkles color="#FBBF24" size={13} />
              <Text className="ml-1.5 text-xs font-bold text-white">
                {activeImage.tag}
              </Text>
            </View>
          ) : null}

          {/* Authentic Guarantee Badge */}
          <View className="absolute bottom-4 right-4 rounded-full bg-emerald-600/90 px-3 py-1 flex-row items-center">
            <ShieldCheck color="#FFFFFF" size={14} />
            <Text className="ml-1 text-xs font-bold text-white">
              100% Artisan Verified
            </Text>
          </View>
        </View>

        {/* Gallery Thumbnails Carousel */}
        {galleryImages.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="border-b border-artisan-border bg-white px-4 py-3"
          >
            {galleryImages.map((item, index) => {
              const isSelected = index === selectedImageIndex;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  activeOpacity={0.8}
                  className={`mr-3 overflow-hidden rounded-2xl border-2 ${
                    isSelected ? 'border-artisan-primary shadow-sm' : 'border-slate-200'
                  }`}
                  style={{ width: 70, height: 70 }}
                >
                  <Image
                    source={{ uri: item.url }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Product Details Section */}
        <View className="bg-white p-5 border-b border-artisan-border">
          {/* Tags */}
          <View className="flex-row items-center flex-wrap gap-2">
            <View className="rounded-full bg-orange-100 px-3 py-1">
              <Text className="text-xs font-bold text-artisan-primary">
                {product.craftType || product.category || 'Handmade Craft'}
              </Text>
            </View>

            {Boolean(product.culturalOrigin) ? (
              <View className="rounded-full bg-slate-100 px-3 py-1">
                <Text className="text-xs font-semibold text-slate-700">
                  {product.culturalOrigin}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Title & Price */}
          <Text className="mt-3 text-2xl font-extrabold text-artisan-slate leading-tight">
            {product.title}
          </Text>

          <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-green-50 p-4 border border-green-200">
            <View>
              <Text className="text-xs font-semibold text-green-700">
                Direct Fair-Trade Artisan Price
              </Text>
              <Text className="text-3xl font-black text-green-900 mt-0.5">
                ₹{product.pricing.recommendedPrice || 499}
              </Text>
            </View>
            <View className="items-end">
              <View className="flex-row items-center rounded-full bg-white px-2.5 py-1 border border-green-300">
                <ShieldCheck color="#16A34A" size={14} />
                <Text className="ml-1 text-xs font-bold text-green-800">
                  Fair Wage
                </Text>
              </View>
              {Boolean(product.pricing.labourHours && Number(product.pricing.labourHours) > 0) ? (
                <Text className="mt-1 text-[11px] text-green-700">
                  ~{product.pricing.labourHours} hrs craftsmanship
                </Text>
              ) : null}
            </View>
          </View>

          {/* Story & Description */}
          <View className="mt-5">
            <Text className="text-sm font-bold uppercase tracking-wider text-artisan-muted">
              Artisan Craft Story • शिल्प कथा
            </Text>
            <Text className="mt-2 text-base text-slate-700 leading-6">
              {product.story || product.description || 'Authentic artisan crafted item.'}
            </Text>
          </View>

          {/* Material & Specs */}
          {Boolean(product.material || product.pattern) ? (
            <View className="mt-5 rounded-2xl bg-slate-50 p-4 border border-artisan-border">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Specifications & Materials
              </Text>
              <View className="mt-3 space-y-2">
                {Boolean(product.material) ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-slate-600">Material:</Text>
                    <Text className="text-sm font-bold text-artisan-slate">
                      {product.material}
                    </Text>
                  </View>
                ) : null}
                {Boolean(product.pattern) ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-slate-600">Pattern/Style:</Text>
                    <Text className="text-sm font-bold text-artisan-slate">
                      {product.pattern}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        {/* Meet the Artisan Card */}
        <View className="bg-white p-5 mt-3 border-b border-artisan-border">
          <Text className="text-sm font-bold uppercase tracking-wider text-artisan-muted">
            Meet the Maker • कारीगर परिचय
          </Text>

          <View className="mt-3 flex-row items-center">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border-2 border-orange-300">
              <Text className="text-2xl font-black text-artisan-primary">
                {(product.artisan?.name || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-artisan-slate">
                {product.artisan?.name || 'Traditional Artisan'}
              </Text>
              {Boolean(product.artisan?.businessName) ? (
                <Text className="text-xs font-semibold text-artisan-muted">
                  {product.artisan.businessName}
                </Text>
              ) : null}
              <View className="mt-1 flex-row items-center">
                <MapPin color="#C85A32" size={13} />
                <Text className="ml-1 text-xs font-medium text-slate-600">
                  {product.artisan?.region || 'Heritage Cluster'}
                  {Boolean(product.artisan?.state) ? `, ${product.artisan.state}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {Boolean(product.artisan?.bio) ? (
            <Text className="mt-3 text-xs italic text-slate-600 leading-5">
              "{product.artisan.bio}"
            </Text>
          ) : null}
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        className="border-t border-artisan-border bg-white px-5 pt-3 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        {/* Primary Buy & Wholesale Row */}
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/buyer/checkout?productId=${product.id}` as any,
              )
            }
            activeOpacity={0.88}
            className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-emerald-600 mr-2 shadow-md active:bg-emerald-700"
          >
            <ShoppingBag color="#FFFFFF" size={20} />
            <Text className="ml-2 text-base font-black text-white">
              Buy Now • ₹{product.pricing.recommendedPrice || 499}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/buyer/b2b-request?productId=${product.id}` as any,
              )
            }
            activeOpacity={0.88}
            className="h-14 px-4 flex-row items-center justify-center rounded-2xl border-2 border-artisan-primary bg-orange-50 active:bg-orange-100"
          >
            <Building2 color="#C85A32" size={18} />
            <Text className="ml-1.5 text-xs font-black text-artisan-primary">
              B2B Quote
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Artisan Row */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleContactWhatsApp}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-100 py-2 mr-2"
          >
            <MessageCircle color="#059669" size={16} />
            <Text className="ml-1.5 text-xs font-bold text-slate-700">
              WhatsApp Maker
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCallArtisan}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-100 py-2"
          >
            <Phone color="#1E293B" size={16} />
            <Text className="ml-1.5 text-xs font-bold text-slate-700">
              Call Workshop
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

