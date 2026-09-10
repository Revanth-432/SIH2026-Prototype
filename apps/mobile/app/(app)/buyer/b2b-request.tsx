import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  Package,
  Calendar,
  IndianRupee,
  FileText,
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { getApiBaseUrl } from '../../../src/lib/api';

interface ProductDetail {
  id: string;
  title: string;
  category: string;
  craftType?: string | null;
  material?: string | null;
  pricing: {
    recommendedPrice?: number | null;
    b2bWholesalePrice?: number | null;
    minWholesaleQty?: number;
  };
  media: {
    thumbnail: string | null;
  };
  artisan: {
    id: string;
    name: string;
    phone?: string | null;
    region?: string | null;
  };
}

export default function BuyerB2BRequestScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role === 'ARTISAN') {
      router.replace('/(app)/dashboard');
    }
  }, [role, isLoading, router]);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState('50');
  const [targetPrice, setTargetPrice] = useState('');
  const [deliveryTimeline, setDeliveryTimeline] = useState('Within 30-45 days');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryCreated, setInquiryCreated] = useState<any | null>(null);

  const getBaseApiUrl = () => {
    return getApiBaseUrl();
  };

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${getBaseApiUrl()}/marketplace/${productId}`);
        if (res.ok) {
          const data: ProductDetail = await res.json();
          setProduct(data);
          if (data.pricing.recommendedPrice) {
            // Suggest ~20% wholesale discount
            const suggestedWholesale = Math.round(data.pricing.recommendedPrice * 0.8);
            setTargetPrice(suggestedWholesale.toString());
          }
        }
      } catch (err) {
        console.warn('Failed to load product for B2B inquiry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmitInquiry = async () => {
    const qty = parseInt(requestedQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a valid wholesale quantity (e.g. 50+).');
      return;
    }

    if (!session?.access_token) {
      Alert.alert('Login Required', 'Please log in to submit a wholesale quote request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getBaseApiUrl()}/b2b/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productId: product!.id,
          requestedQuantity: qty,
          targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
          deliveryTimeline: deliveryTimeline.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInquiryCreated(data);
      } else {
        const errData = await res.json();
        Alert.alert('Submission Failed', errData.message || 'Could not submit inquiry.');
      }
    } catch (err) {
      console.warn('B2B Inquiry error:', err);
      Alert.alert('Connection Error', 'Failed to connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-artisan-canvas"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <ActivityIndicator size="large" color="#C85A32" />
        <Text className="mt-3 text-sm font-bold text-artisan-slate">
          Loading craft specifications...
        </Text>
      </View>
    );
  }

  // Success Confirmation View
  if (inquiryCreated) {
    return (
      <View
        className="flex-1 bg-artisan-canvas justify-center items-center p-6"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <View className="w-full rounded-3xl bg-white p-6 shadow-md border border-artisan-border items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-300">
            <Building2 color="#C85A32" size={40} />
          </View>

          <Text className="mt-5 text-2xl font-black text-artisan-slate text-center">
            Wholesale RFQ Submitted!
          </Text>
          <Text className="text-sm font-semibold text-artisan-primary mt-1">
            थोक पूछताछ सफलतापूर्वक भेजी गई
          </Text>

          <View className="my-5 w-full rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-artisan-muted">RFQ ID:</Text>
              <Text className="text-xs font-mono font-bold text-slate-800">
                #{inquiryCreated.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-artisan-muted">Quantity:</Text>
              <Text className="text-xs font-bold text-slate-800">
                {inquiryCreated.requestedQuantity} Units
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-artisan-muted">Target Price:</Text>
              <Text className="text-xs font-bold text-green-700">
                {inquiryCreated.targetPricePerUnit
                  ? `₹${inquiryCreated.targetPricePerUnit} / unit`
                  : 'Artisan to Quote'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-artisan-muted">Artisan Maker:</Text>
              <Text className="text-xs font-bold text-slate-800">
                {product?.artisan.name}
              </Text>
            </View>
          </View>

          <Text className="text-center text-xs text-slate-600 leading-5">
            The artisan workshop has been notified of your bulk requirements. You can also start an immediate WhatsApp discussion.
          </Text>

          {/* Quick WhatsApp Connect */}
          {Boolean(product?.artisan?.phone) ? (
            <TouchableOpacity
              onPress={() => {
                const text = `Namaste ${product?.artisan.name}! I submitted wholesale RFQ #${inquiryCreated.id.slice(0, 8).toUpperCase()} for ${inquiryCreated.requestedQuantity} units of "${product?.title}". Let's discuss production timeline and sample delivery.`;
                Linking.openURL(
                  `whatsapp://send?phone=${product?.artisan.phone!.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(text)}`,
                );
              }}
              className="mt-4 h-14 w-full flex-row items-center justify-center rounded-2xl bg-emerald-600 shadow-md active:bg-emerald-700"
            >
              <MessageCircle color="#FFFFFF" size={20} />
              <Text className="ml-2 text-base font-extrabold text-white">
                Chat with Artisan on WhatsApp
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => router.replace('/(app)/buyer/feed' as any)}
            className="mt-3 h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white"
          >
            <Text className="text-sm font-bold text-slate-700">
              Return to Marketplace
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      {/* Header */}
      <View className="flex-row items-center border-b border-artisan-border bg-white px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 mr-3"
        >
          <ArrowLeft color="#1E293B" size={22} />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-black text-artisan-slate">
            B2B Bulk Quotation
          </Text>
          <Text className="text-xs text-artisan-muted">
            Direct Wholesale & Institutional Sourcing
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Product Card */}
        {product && (
          <View className="rounded-3xl border border-artisan-border bg-white p-4 shadow-sm mb-5">
            <View className="flex-row items-center">
              <View className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 border border-artisan-border">
                {product.media.thumbnail ? (
                  <Image
                    source={{ uri: product.media.thumbnail }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-orange-50">
                    <ShoppingBag color="#C85A32" size={28} />
                  </View>
                )}
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-xs font-bold text-artisan-primary uppercase">
                  {product.craftType || product.category}
                </Text>
                <Text
                  className="mt-0.5 text-base font-bold text-artisan-slate"
                  numberOfLines={1}
                >
                  {product.title}
                </Text>
                <Text className="text-xs text-artisan-muted">
                  Maker: {product.artisan.name} • {product.artisan.region || 'India'}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Retail Reference: ₹{product.pricing.recommendedPrice || 499}/unit
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* RFQ Form */}
        <View className="rounded-3xl border border-artisan-border bg-white p-5 shadow-sm mb-8">
          <Text className="text-base font-extrabold text-artisan-slate mb-4">
            Wholesale Requirements / थोक आवश्यकताएं
          </Text>

          {/* Requested Quantity */}
          <View className="mb-4">
            <View className="flex-row items-center mb-1.5">
              <Package color="#C85A32" size={14} />
              <Text className="ml-1 text-xs font-bold text-slate-700">
                Bulk Units Required *
              </Text>
            </View>
            <TextInput
              value={requestedQuantity}
              onChangeText={setRequestedQuantity}
              placeholder="e.g. 50, 100, 500"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3.5 text-base font-black text-artisan-slate"
            />
          </View>

          {/* Target Price */}
          <View className="mb-4">
            <View className="flex-row items-center mb-1.5">
              <IndianRupee color="#C85A32" size={14} />
              <Text className="ml-1 text-xs font-bold text-slate-700">
                Target Budget Per Unit (₹)
              </Text>
            </View>
            <TextInput
              value={targetPrice}
              onChangeText={setTargetPrice}
              placeholder="e.g. 350"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3.5 text-base font-semibold text-artisan-slate"
            />
          </View>

          {/* Delivery Timeline */}
          <View className="mb-4">
            <View className="flex-row items-center mb-1.5">
              <Calendar color="#64748B" size={14} />
              <Text className="ml-1 text-xs font-bold text-slate-700">
                Required Delivery Timeline
              </Text>
            </View>
            <TextInput
              value={deliveryTimeline}
              onChangeText={setDeliveryTimeline}
              placeholder="e.g. Within 30 days / Before October"
              placeholderTextColor="#94A3B8"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-artisan-slate"
            />
          </View>

          {/* Custom Specifications */}
          <View>
            <View className="flex-row items-center mb-1.5">
              <FileText color="#64748B" size={14} />
              <Text className="ml-1 text-xs font-bold text-slate-700">
                Custom Branding & Packaging Notes
              </Text>
            </View>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Specify custom tags, corporate branding stamps, or export packaging requirements..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 text-sm text-artisan-slate"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Submit Button */}
      <View
        className="border-t border-artisan-border bg-white px-5 pt-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        <TouchableOpacity
          onPress={handleSubmitInquiry}
          disabled={submitting}
          activeOpacity={0.88}
          className="h-16 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-md active:bg-orange-700"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Building2 color="#FFFFFF" size={22} />
              <Text className="ml-2 text-lg font-black text-white">
                Submit Wholesale RFQ
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
