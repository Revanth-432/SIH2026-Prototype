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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Phone,
  FileText,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { getApiBaseUrl } from '../../../src/lib/api';

interface ProductDetail {
  id: string;
  title: string;
  category: string;
  craftType?: string | null;
  pricing: {
    recommendedPrice?: number | null;
    currency: string;
    labourHours?: number | null;
  };
  media: {
    thumbnail: string | null;
  };
  baseStock?: number;
  artisan: {
    id: string;
    name: string;
    region?: string | null;
  };
}


export default function BuyerCheckoutScreen() {
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
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);

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
        }
      } catch (err) {
        console.warn('Failed to load product for checkout:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const unitPrice = product?.pricing.recommendedPrice || 499;
  const totalAmount = unitPrice * quantity;

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address.');
      return;
    }

    if (!buyerPhone.trim()) {
      Alert.alert('Phone Required', 'Please enter your contact phone number.');
      return;
    }

    if (!session?.access_token) {
      Alert.alert('Login Required', 'Please log in to complete your order.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getBaseApiUrl()}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: [
            {
              productId: product!.id,
              quantity,
            },
          ],
          shippingAddress: shippingAddress.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerNotes: buyerNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderConfirmed(data);
      } else {
        const errorData = await res.json();
        Alert.alert('Order Failed', errorData.message || 'Could not place order.');
      }
    } catch (err) {
      console.warn('Place order error:', err);
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
          Preparing checkout...
        </Text>
      </View>
    );
  }

  // Order Confirmation Success View
  if (orderConfirmed) {
    return (
      <View
        className="flex-1 bg-artisan-canvas justify-center items-center p-6"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <View className="w-full rounded-3xl bg-white p-6 shadow-md border border-artisan-border items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-green-100 border-2 border-green-300">
            <CheckCircle2 color="#16A34A" size={48} />
          </View>

          <Text className="mt-5 text-2xl font-black text-artisan-slate text-center">
            Order Placed Successfully!
          </Text>
          <Text className="text-sm font-semibold text-artisan-primary mt-1">
            ऑर्डर सफलतापूर्वक दर्ज किया गया
          </Text>

          <View className="mt-4 w-full rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-slate-500">Order ID:</Text>
              <Text className="text-xs font-mono font-bold text-artisan-slate">
                {orderConfirmed.id ? orderConfirmed.id.slice(0, 8).toUpperCase() : 'CONFIRMED'}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-slate-500">Total Amount:</Text>
              <Text className="text-xs font-bold text-green-800">
                ₹{orderConfirmed.totalAmount || totalAmount}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Status:</Text>
              <Text className="text-xs font-bold text-amber-700">
                PENDING ARTISAN ACCEPTANCE
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-center text-xs text-artisan-muted leading-relaxed">
            The artisan has been notified to prepare and package your handcrafted items. You will receive SMS dispatch updates.
          </Text>

          {/* View My Orders Action */}
          <TouchableOpacity
            onPress={() => router.replace('/(app)/buyer-orders')}
            activeOpacity={0.88}
            className="mt-6 w-full h-14 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-md active:bg-orange-700"
          >
            <ShoppingBag color="#FFFFFF" size={20} />
            <Text className="ml-2 text-base font-extrabold text-white">
              View My Orders / मेरे ऑर्डर
            </Text>
          </TouchableOpacity>

          {/* Continue Shopping Action */}
          <TouchableOpacity
            onPress={() => router.replace('/(app)/buyer/feed')}
            activeOpacity={0.8}
            className="mt-3 py-2 px-4"
          >
            <Text className="text-xs font-bold text-slate-500">
              Back to Marketplace / बाज़ार
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
            Direct Artisan Checkout
          </Text>
          <Text className="text-xs text-artisan-muted">
            100% Transparent Fair-Trade Purchase
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Craft Summary Card */}
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
                  Handcrafted by {product.artisan.name}
                </Text>
                <Text className="mt-1 text-lg font-black text-green-700">
                  ₹{unitPrice}
                </Text>
              </View>
            </View>

            {/* Quantity Selector */}
            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <View>
                <Text className="text-sm font-bold text-artisan-slate">
                  Quantity / संख्या
                </Text>
                {product?.baseStock ? (
                  <Text className="text-[11px] text-artisan-primary font-bold mt-0.5">
                    Max order limit: {product.baseStock} units
                  </Text>
                ) : null}
              </View>
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 mr-2"
                >
                  <Minus color="#1E293B" size={18} />
                </TouchableOpacity>
                <Text className="text-lg font-black text-artisan-slate min-w-[20px] text-center mr-2">
                  {quantity}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const limit = product?.baseStock || 10;
                    if (quantity >= limit) {
                      Alert.alert(
                        'अधिकतम सीमा (Max Limit)',
                        `This artisan has set a maximum order limit of ${limit} units for this craft.`,
                      );
                      return;
                    }
                    setQuantity(quantity + 1);
                  }}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
                >
                  <Plus color="#1E293B" size={18} />
                </TouchableOpacity>
              </View>
            </View>

          </View>
        )}

        {/* Delivery Details Form */}
        <View className="rounded-3xl border border-artisan-border bg-white p-5 shadow-sm mb-5">
          <Text className="text-base font-extrabold text-artisan-slate mb-3">
            Delivery Details / डिलीवरी पता
          </Text>

          {/* Shipping Address */}
          <View className="mb-4">
            <View className="flex-row items-center mb-1.5">
              <MapPin color="#C85A32" size={14} />
              <Text className="ml-1 text-xs font-bold text-slate-700">
                Delivery Address *
              </Text>
            </View>
            <TextInput
              value={shippingAddress}
              onChangeText={setShippingAddress}
              placeholder="House/Flat No, Street, City, State, PIN code"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 text-sm text-artisan-slate"
            />
          </View>

          {/* Contact Phone */}
          <View className="mb-4">
            <View className="flex-row items-center mb-1.5">
              <Phone color="#C85A32" size={14} />
              <Text className="ml-1 text-xs font-bold text-slate-700">
                Contact Phone *
              </Text>
            </View>
            <TextInput
              value={buyerPhone}
              onChangeText={setBuyerPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              className="h-14 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3.5 text-base font-semibold text-artisan-slate"
            />
          </View>

          {/* Delivery Notes */}
          <View>
            <View className="flex-row items-center mb-1.5">
              <FileText color="#64748B" size={14} />
              <Text className="ml-1 text-xs font-semibold text-slate-600">
                Special Note / Custom Request (Optional)
              </Text>
            </View>
            <TextInput
              value={buyerNotes}
              onChangeText={setBuyerNotes}
              placeholder="e.g. Gift wrapping or specific handling instructions"
              placeholderTextColor="#94A3B8"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-artisan-slate"
            />
          </View>
        </View>

        {/* Transparent Price Breakdown */}
        <View className="rounded-3xl border border-green-200 bg-green-50 p-5 mb-8">
          <View className="flex-row items-center mb-3">
            <ShieldCheck color="#16A34A" size={18} />
            <Text className="ml-1.5 text-sm font-extrabold text-green-900">
              Direct-to-Artisan Fair Pricing
            </Text>
          </View>

          <View className="space-y-2 border-b border-green-200 pb-3">
            <View className="flex-row justify-between">
              <Text className="text-xs text-green-800">
                Craft Subtotal ({quantity} unit{quantity > 1 ? 's' : ''}):
              </Text>
              <Text className="text-xs font-bold text-green-900">
                ₹{totalAmount}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-green-800">Artisan Fair Pay:</Text>
              <Text className="text-xs font-bold text-green-900">100%</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-green-800">Platform Facilitation:</Text>
              <Text className="text-xs font-bold text-green-900">₹0 (Zero Fee)</Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-green-950">
              Total Payable:
            </Text>
            <Text className="text-2xl font-black text-green-950">
              ₹{totalAmount}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Place Order Button */}
      <View
        className="border-t border-artisan-border bg-white px-5 pt-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.88}
          className="h-16 flex-row items-center justify-center rounded-2xl bg-emerald-600 shadow-md active:bg-emerald-700"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 color="#FFFFFF" size={22} />
              <Text className="ml-2 text-lg font-black text-white">
                Place Order • ₹{totalAmount}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
