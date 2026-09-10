import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Phone,
  MapPin,
  ShoppingBag,
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

interface Order {
  id: string;
  buyerName: string;
  buyerPhone?: string | null;
  shippingAddress?: string | null;
  buyerNotes?: string | null;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
}

export default function ArtisanOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();
  const isFetchingRef = React.useRef(false);

  // Guard: If a buyer ever navigates here, redirect immediately to buyer orders
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer-orders');
    }
  }, [role, isLoading, router]);

  // ONLY original database values — initialized strictly to empty array
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch only original orders from the backend database (stabilized with empty deps)
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
      const res = await fetch(`${baseUrl}/orders/artisan`, {
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
        console.warn('Orders API returned non-OK status:', res.status);
        setOrders([]);
      }
    } catch (err: any) {
      console.warn('Failed to fetch artisan orders:', err?.message || err);
      setOrders([]);
    } finally {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch when tab becomes active (guaranteed stable callback)
  useFocusEffect(
    useCallback(() => {
      fetchOrders(false);
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, [fetchOrders]);

  // Status transition handler for authentic database updates
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED',
  ) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );

    const state = useAuthStore.getState();
    let token = state.session?.access_token;
    if (!token) {
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData.session?.access_token;
    }
    if (!token) return;

    setUpdatingId(orderId);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        console.warn('Failed to update order status on server:', res.status);
        // Refresh to revert to DB state on failure
        fetchOrders(true);
      }
    } catch (err) {
      console.warn('Update order network warning:', err);
      fetchOrders(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <View className="flex-row items-center rounded-full bg-amber-100 px-3 py-1 border border-amber-300">
            <Clock color="#D97706" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-amber-800">
              New Order / नया
            </Text>
          </View>
        );
      case 'CONFIRMED':
        return (
          <View className="flex-row items-center rounded-full bg-blue-100 px-3 py-1 border border-blue-300">
            <CheckCircle2 color="#2563EB" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-blue-800">
              Accepted / स्वीकृत
            </Text>
          </View>
        );
      case 'SHIPPED':
        return (
          <View className="flex-row items-center rounded-full bg-purple-100 px-3 py-1 border border-purple-300">
            <Truck color="#7C3AED" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-purple-800">
              Shipped / भेजा गया
            </Text>
          </View>
        );
      case 'DELIVERED':
        return (
          <View className="flex-row items-center rounded-full bg-green-100 px-3 py-1 border border-green-300">
            <CheckCircle2 color="#16A34A" size={13} />
            <Text className="ml-1.5 text-xs font-bold text-green-800">
              Completed / पूरा
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

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isBusy = updatingId === item.id;

    return (
      <View className="mb-5 rounded-3xl border-2 border-artisan-border bg-white p-5 shadow-sm">
        {/* Card Header */}
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
          <View>
            <Text className="text-xs font-bold text-artisan-muted">
              Order #{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text className="text-sm font-extrabold text-artisan-slate">
              Customer: {item.buyerName}
            </Text>
          </View>
          {renderOrderStatusBadge(item.status)}
        </View>

        {/* Item List */}
        <View className="mt-3 space-y-3">
          {item.items && item.items.length > 0 ? (
            item.items.map((orderItem) => (
              <View key={orderItem.id} className="flex-row items-center">
                <View className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 border border-artisan-border">
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
                    Quantity: {orderItem.quantity} unit
                    {orderItem.quantity > 1 ? 's' : ''} • ₹
                    {orderItem.priceAtPurchase} each
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-xs text-artisan-muted italic">
              No individual items listed.
            </Text>
          )}
        </View>

        {/* Customer Address & Notes */}
        {(Boolean(item.shippingAddress) || Boolean(item.buyerNotes)) && (
          <View className="mt-3 rounded-2xl bg-slate-50 p-3">
            {Boolean(item.shippingAddress) ? (
              <View className="flex-row items-start">
                <MapPin color="#64748B" size={14} className="mt-0.5" />
                <Text className="ml-1.5 flex-1 text-xs text-slate-600">
                  {item.shippingAddress}
                </Text>
              </View>
            ) : null}
            {Boolean(item.buyerNotes) ? (
              <Text className="mt-1 text-xs italic text-artisan-muted">
                Note: "{item.buyerNotes}"
              </Text>
            ) : null}
          </View>
        )}

        {/* Total & Call Action */}
        <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
          <View>
            <Text className="text-xs font-semibold text-artisan-muted">
              Total Payout / कुल भुगतान
            </Text>
            <Text className="text-2xl font-black text-green-800">
              ₹{item.totalAmount}
            </Text>
          </View>

          {item.buyerPhone ? (
            <TouchableOpacity
              onPress={() => {
                if (item.buyerPhone) {
                  Linking.openURL(`tel:${item.buyerPhone}`);
                }
              }}
              activeOpacity={0.8}
              className="h-12 flex-row items-center rounded-2xl bg-slate-100 px-4 active:bg-slate-200"
            >
              <Phone color="#1E293B" size={18} />
              <Text className="ml-2 text-xs font-bold text-slate-800">
                Call Buyer
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Transition Action Buttons (Low Literacy Friendly, Min 56px touch target) */}
        <View className="mt-4">
          {item.status === 'PENDING' && (
            <TouchableOpacity
              onPress={() => handleUpdateOrderStatus(item.id, 'CONFIRMED')}
              disabled={isBusy}
              activeOpacity={0.88}
              className="h-14 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-md active:bg-orange-700"
            >
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 color="#FFFFFF" size={20} />
                  <Text className="ml-2 text-base font-extrabold text-white">
                    Accept Order / ऑर्डर स्वीकार करें
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {item.status === 'CONFIRMED' && (
            <TouchableOpacity
              onPress={() => handleUpdateOrderStatus(item.id, 'SHIPPED')}
              disabled={isBusy}
              activeOpacity={0.88}
              className="h-14 flex-row items-center justify-center rounded-2xl bg-purple-600 shadow-md active:bg-purple-700"
            >
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Truck color="#FFFFFF" size={20} />
                  <Text className="ml-2 text-base font-extrabold text-white">
                    Mark Shipped / भेज दिया
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {item.status === 'SHIPPED' && (
            <TouchableOpacity
              onPress={() => handleUpdateOrderStatus(item.id, 'DELIVERED')}
              disabled={isBusy}
              activeOpacity={0.88}
              className="h-14 flex-row items-center justify-center rounded-2xl bg-green-600 shadow-md active:bg-green-700"
            >
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 color="#FFFFFF" size={20} />
                  <Text className="ml-2 text-base font-extrabold text-white">
                    Confirm Delivered / डिलीवर हुआ
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {item.status === 'DELIVERED' && (
            <View className="h-12 flex-row items-center justify-center rounded-2xl bg-green-50 border border-green-200">
              <CheckCircle2 color="#16A34A" size={18} />
              <Text className="ml-2 text-sm font-bold text-green-800">
                Order Fulfilled & Paid • भुगतान पूरा
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
    >
      {/* Top Header */}
      <View className="border-b border-artisan-border bg-white px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.navigate('/(app)/dashboard')}
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 active:bg-slate-200"
          >
            <ArrowLeft color="#1E293B" size={22} />
          </TouchableOpacity>

          <View className="items-center flex-1 px-3">
            <Text className="text-xl font-black text-artisan-slate">
              Orders & Sales
            </Text>
            <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
              सीधे ग्राहक ऑर्डर प्रबंधन
            </Text>
          </View>

          <View className="rounded-full bg-orange-100 px-3 py-1 border border-orange-200">
            <Text className="text-xs font-extrabold text-artisan-primary">
              {orders.length} Orders
            </Text>
          </View>
        </View>
      </View>

      {/* Direct Orders Content List (Only Database Data) */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C85A32" />
          <Text className="mt-4 text-sm font-bold text-artisan-slate">
            Loading orders from database...
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={{
            padding: 18,
            paddingBottom: 110,
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
            <View className="items-center justify-center p-8 mt-10 rounded-3xl border-2 border-dashed border-artisan-border bg-white">
              <Package color="#C85A32" size={52} />
              <Text className="mt-4 text-lg font-black text-artisan-slate text-center">
                No Orders Yet / कोई ऑर्डर नहीं
              </Text>
              <Text className="mt-2 text-center text-xs text-artisan-muted leading-5 max-w-xs">
                When buyers purchase your handcrafted crafts from the marketplace,
                their orders will appear here automatically for one-tap fulfillment.
              </Text>
              <TouchableOpacity
                onPress={() => onRefresh()}
                className="mt-5 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2"
                activeOpacity={0.8}
              >
                <Text className="text-xs font-bold text-artisan-primary">
                  Refresh Orders / रिफ्रेश करें
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
