import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  React.useEffect(() => {
    if (!isLoading && role === 'ARTISAN') {
      router.replace('/(app)/dashboard');
    }
  }, [role, isLoading, router]);

  const { items, updateQuantity, removeFromCart, clearCart, getTotalAmount, getTotalCount } =
    useCartStore();

  const totalAmount = getTotalAmount();
  const totalCount = getTotalCount();

  const handleCheckout = () => {
    if (items.length === 0) return;
    // Route to checkout using the primary item in cart
    const firstItem = items[0];
    if (firstItem) {
      router.push({
        pathname: '/(app)/buyer/checkout',
        params: { productId: firstItem.id },
      } as any);
    }
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
    >
      {/* Header */}
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
              My Cart • कार्ट
            </Text>
            <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
              {totalCount} {totalCount === 1 ? 'Item' : 'Items'} selected
            </Text>
          </View>

          {items.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'खाली करें (Clear Cart)',
                  'Are you sure you want to empty your cart?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearCart },
                  ],
                );
              }}
              className="p-2"
            >
              <Trash2 color="#EF4444" size={20} />
            </TouchableOpacity>
          ) : (
            <View className="w-11" />
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-orange-50 border-2 border-dashed border-orange-200">
            <ShoppingBag color="#C85A32" size={44} />
          </View>
          <Text className="mt-5 text-xl font-black text-artisan-slate text-center">
            Your Cart is Empty
          </Text>
          <Text className="mt-1.5 text-sm font-bold text-artisan-amber text-center">
            आपकी कार्ट खाली है
          </Text>
          <Text className="mt-2 text-xs text-artisan-muted text-center max-w-xs leading-5">
            Discover handcrafted authentic crafts directly made by rural Indian artisans and add them to your cart.
          </Text>

          <TouchableOpacity
            onPress={() => router.navigate('/(app)/buyer/feed' as any)}
            activeOpacity={0.88}
            className="mt-6 h-13 px-6 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-md"
          >
            <Sparkles color="#FFFFFF" size={18} />
            <Text className="ml-2 text-sm font-extrabold text-white">
              Explore Crafts / शिल्प देखें
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 18, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cart Items List */}
          <View className="space-y-4 mb-6">
            {items.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center rounded-3xl border border-artisan-border bg-white p-4 shadow-sm mb-3"
              >
                {/* Image */}
                <View className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                  {item.thumbnailUrl ? (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-orange-50">
                      <ShoppingBag color="#C85A32" size={28} />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View className="ml-3.5 flex-1 pr-2">
                  <Text
                    className="text-base font-extrabold text-artisan-slate"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-xs font-medium text-artisan-muted mt-0.5">
                    By {item.artisanName || 'Heritage Artisan'}
                  </Text>
                  <Text className="text-base font-black text-green-800 mt-1">
                    ₹{item.price}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View className="items-end justify-between h-20">
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id)}
                    className="p-1"
                  >
                    <Trash2 color="#94A3B8" size={16} />
                  </TouchableOpacity>

                  <View className="flex-row items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 items-center justify-center rounded-lg bg-white"
                      activeOpacity={0.7}
                    >
                      <Minus color="#1E293B" size={13} />
                    </TouchableOpacity>

                    <Text className="mx-2.5 text-xs font-black text-artisan-slate">
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 items-center justify-center rounded-lg bg-artisan-primary"
                      activeOpacity={0.7}
                    >
                      <Plus color="#FFFFFF" size={13} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Bill Summary */}
          <View className="rounded-3xl border border-artisan-border bg-white p-5 shadow-sm">
            <Text className="text-sm font-extrabold text-artisan-slate mb-3 border-b border-slate-100 pb-2">
              Price Details • मूल्य विवरण
            </Text>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-slate-600">Total Items / कुल वस्तुएं</Text>
              <Text className="text-xs font-bold text-slate-800">{totalCount} units</Text>
            </View>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-slate-600">Direct Artisan Pay</Text>
              <Text className="text-xs font-bold text-slate-800">100% Guaranteed</Text>
            </View>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-slate-600">Delivery / शिपिंग शुल्क</Text>
              <Text className="text-xs font-bold text-green-700">FREE / मुफ़्त</Text>
            </View>

            <View className="mt-3 flex-row justify-between border-t border-slate-100 pt-3">
              <Text className="text-base font-black text-artisan-slate">Total Amount</Text>
              <Text className="text-2xl font-black text-artisan-primary">
                ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Checkout CTA */}
          <TouchableOpacity
            onPress={handleCheckout}
            activeOpacity={0.88}
            className="mt-6 h-15 flex-row items-center justify-center rounded-2xl bg-artisan-primary p-4 shadow-lg shadow-orange-900/20 active:bg-orange-700"
          >
            <Text className="text-base font-black text-white mr-2">
              Order Now • अभी ऑर्डर करें (₹{totalAmount.toLocaleString('en-IN')})
            </Text>
            <ArrowRight color="#FFFFFF" size={20} />
          </TouchableOpacity>

          <View className="mt-4 flex-row items-center justify-center">
            <ShieldCheck color="#059669" size={16} />
            <Text className="ml-1.5 text-xs font-semibold text-emerald-700">
              100% Direct to Artisan • Fair Trade Certified
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
