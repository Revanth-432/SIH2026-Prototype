import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShoppingBag,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Store,
} from 'lucide-react-native';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Text, Button, ScreenHeader, EmptyState, Stepper, COLORS } from '../../src/components/ui';
import { useT } from '../../src/i18n';

export default function CartScreen() {
  const router = useRouter();
  const { t, language } = useT();
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
    <View className="flex-1 bg-artisan-canvas">
      <ScreenHeader
        title={t('tabs.cart')}
        subtitle={t('common.itemsCount', { n: totalCount })}
        onBack={() => router.navigate('/(app)/buyer/feed' as any)}
        right={
          items.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(t('buyer.emptyCartTitle'), t('buyer.emptyCartMsg'), [
                  { text: t('common.no'), style: 'cancel' },
                  { text: t('buyer.emptyCartYes'), style: 'destructive', onPress: clearCart },
                ]);
              }}
              accessibilityLabel="Empty cart"
              className="h-12 w-12 items-center justify-center rounded-xl bg-red-50"
            >
              <Trash2 color={COLORS.error} size={22} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <View key="empty" className="flex-1 justify-center p-4">
          <EmptyState
            icon={ShoppingBag}
            title={t('buyer.cartEmpty')}
            action={
              <Button
                label={t('buyer.startShopping')}
                icon={Store}
                onPress={() => router.navigate('/(app)/buyer/feed' as any)}
              />
            }
          />
        </View>
      ) : (
        <View key="items" className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View key={item.id} className="mb-3 rounded-2xl border border-artisan-border bg-white p-3">
                <View className="flex-row">
                  <View className="h-20 w-20 overflow-hidden rounded-xl bg-stone-100">
                    {item.thumbnailUrl ? (
                      <Image source={{ uri: item.thumbnailUrl }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center bg-artisan-light">
                        <ShoppingBag color={COLORS.primary} size={28} />
                      </View>
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-lg font-bold text-artisan-slate" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="text-sm text-artisan-muted">{t('common.by', { name: item.artisanName || 'Artisan' })}</Text>
                    <Text className="text-xl font-bold text-artisan-success">₹{item.price}</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between border-t border-artisan-border pt-3">
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id)}
                    className="h-12 flex-row items-center px-2"
                  >
                    <Trash2 color={COLORS.error} size={20} />
                    <Text className="ml-1.5 text-base font-semibold text-artisan-error">{t('buyer.remove')}</Text>
                  </TouchableOpacity>
                  <Stepper
                    value={item.quantity}
                    onMinus={() => updateQuantity(item.id, item.quantity - 1)}
                    onPlus={() => updateQuantity(item.id, item.quantity + 1)}
                  />
                </View>
              </View>
            ))}

            <View className="mt-2 rounded-2xl border border-artisan-border bg-white p-4">
              <View className="flex-row justify-between py-1">
                <Text className="text-base text-artisan-muted">{t('buyer.items')}</Text>
                <Text className="text-base font-semibold text-artisan-slate">{totalCount}</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-base text-artisan-muted">{t('buyer.delivery')}</Text>
                <Text className="text-base font-semibold text-artisan-success">{t('buyer.free')}</Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between border-t border-artisan-border pt-2">
                <Text className="text-lg font-bold text-artisan-slate">{t('common.total')}</Text>
                <Text className="text-2xl font-bold text-artisan-slate">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center">
                <ShieldCheck color={COLORS.success} size={18} />
                <Text className="ml-1.5 text-sm text-artisan-success">{t('buyer.toArtisan')}</Text>
              </View>
            </View>
          </ScrollView>

          <View
            className="border-t border-artisan-border bg-white px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) + 70 }}
          >
            <Button
              label={t('buyer.checkoutPrice', { p: totalAmount.toLocaleString('en-IN') })}
              icon={ArrowRight}
              onPress={handleCheckout}
            />
          </View>
        </View>
      )}
    </View>
  );
}
