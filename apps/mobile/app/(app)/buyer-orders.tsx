import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowLeft,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { getApiBaseUrl } from '../../src/lib/api';

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  priceAtPurchase: number;
  thumbnailUrl: string | null;
}

interface BuyerOrder {
  id: string;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress?: string | null;
  createdAt: string;
  artisanName: string;
  items: OrderItem[];
}

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();
  const isFetchingRef = React.useRef(false);

  // Role Protection Guard
  React.useEffect(() => {
    if (!isLoading && role === 'ARTISAN') {
      router.replace('/(app)/orders');
    }
  }, [role, isLoading, router]);

  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const state = useAuthStore.getState();
      let token = state.session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token;
      }

      if (!token) {
        clearTimeout(timeoutId);
        setOrders([]);
        return;
      }

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/orders/buyer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.warn('Failed to fetch buyer orders:', err?.message || err);
      setOrders([]);
    } finally {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(false);
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, [fetchOrders]);

  const renderStatusBadge = (status: BuyerOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <View className="flex-row items-center rounded-full bg-amber-100 px-3 py-1 border border-amber-300">
            <Clock color="#D97706" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-amber-800">
              Placed / ऑर्डर दिया
            </Text>
          </View>
        );
      case 'CONFIRMED':
        return (
          <View className="flex-row items-center rounded-full bg-blue-100 px-3 py-1 border border-blue-300">
            <CheckCircle2 color="#2563EB" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-blue-800">
              Accepted by Artisan
            </Text>
          </View>
        );
      case 'SHIPPED':
        return (
          <View className="flex-row items-center rounded-full bg-purple-100 px-3 py-1 border border-purple-300">
            <Truck color="#7C3AED" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-purple-800">
              In Transit / भेजा गया
            </Text>
          </View>
        );
      case 'DELIVERED':
        return (
          <View className="flex-row items-center rounded-full bg-green-100 px-3 py-1 border border-green-300">
            <CheckCircle2 color="#16A34A" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-green-800">
              Delivered / डिलीवर हुआ
            </Text>
          </View>
        );
      default:
        return (
          <View className="rounded-full bg-slate-100 px-3 py-1">
            <Text className="text-xs font-bold text-slate-700">{status}</Text>
          </View>
        );
    }
  };

  const renderOrderCard = ({ item }: { item: BuyerOrder }) => (
    <View className="mb-5 rounded-3xl border border-artisan-border bg-white p-5 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
        <View>
          <Text className="text-xs font-bold text-artisan-muted">
            Order #{item.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text className="text-sm font-extrabold text-artisan-slate mt-0.5">
            Artisan: {item.artisanName || 'Heritage Artisan'}
          </Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      {/* Items */}
      <View className="mt-3 space-y-3">
        {item.items && item.items.length > 0 ? (
          item.items.map((orderItem) => (
            <View key={orderItem.id} className="flex-row items-center py-1">
              <View className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                {orderItem.thumbnailUrl ? (
                  <Image
                    source={{ uri: orderItem.thumbnailUrl }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-orange-50">
                    <ShoppingBag color="#C85A32" size={24} />
                  </View>
                )}
              </View>

              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-bold text-artisan-slate"
                  numberOfLines={1}
                >
                  {orderItem.title}
                </Text>
                <Text className="mt-0.5 text-xs text-artisan-muted">
                  Quantity: {orderItem.quantity} unit • ₹{orderItem.priceAtPurchase}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-xs text-artisan-muted italic">Handcrafted order items</Text>
        )}
      </View>

      {/* Address */}
      {Boolean(item.shippingAddress) ? (
        <View className="mt-3 rounded-2xl bg-slate-50 p-3 flex-row items-start">
          <MapPin color="#64748B" size={14} className="mt-0.5" />
          <Text className="ml-1.5 flex-1 text-xs text-slate-600">
            Delivering to: {item.shippingAddress}
          </Text>
        </View>
      ) : null}

      {/* Footer Total */}
      <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
        <Text className="text-xs font-semibold text-artisan-muted">
          Paid Amount / कुल भुगतान
        </Text>
        <Text className="text-xl font-black text-artisan-primary">
          ₹{item.totalAmount}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
    >
      {/* Top Header */}
      <View className="border-b border-artisan-border bg-white px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.navigate('/(app)/buyer/feed' as any)}
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"
          >
            <ArrowLeft color="#1E293B" size={22} />
          </TouchableOpacity>

          <View className="items-center flex-1 px-3">
            <Text className="text-xl font-black text-artisan-slate">
              My Orders • मेरे ऑर्डर
            </Text>
            <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
              Purchases & Delivery Tracking
            </Text>
          </View>

          <View className="rounded-full bg-orange-100 px-3 py-1 border border-orange-200">
            <Text className="text-xs font-extrabold text-artisan-primary">
              {orders.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C85A32" />
          <Text className="mt-4 text-sm font-bold text-artisan-slate">
            Loading your orders...
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={{
            padding: 18,
            paddingBottom: 120,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C85A32"
              colors={['#C85A32']}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center p-8 mt-12 rounded-3xl border-2 border-dashed border-artisan-border bg-white">
              <Package color="#C85A32" size={48} />
              <Text className="mt-4 text-lg font-black text-artisan-slate text-center">
                No Orders Placed Yet
              </Text>
              <Text className="mt-1 text-sm font-bold text-artisan-amber text-center">
                आपने अभी तक कोई ऑर्डर नहीं दिया है
              </Text>
              <Text className="mt-2 text-center text-xs text-artisan-muted leading-5 max-w-xs">
                Browse authentic handcrafted products from rural artisans across India and place your first order.
              </Text>
              <TouchableOpacity
                onPress={() => router.navigate('/(app)/buyer/feed' as any)}
                activeOpacity={0.88}
                className="mt-5 h-12 px-6 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-md"
              >
                <Sparkles color="#FFFFFF" size={16} />
                <Text className="ml-2 text-xs font-extrabold text-white">
                  Shop Crafts / खरीदारी करें
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
