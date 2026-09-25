import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Package,
  ShoppingBag,
  Camera,
  ChevronRight,
  IndianRupee,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { getApiBaseUrl } from '../../src/lib/api';
import { Text, StatTile, SectionTitle, COLORS } from '../../src/components/ui';
import { useT } from '../../src/i18n';

export default function DashboardScreen() {
  const router = useRouter();
  const { t, language } = useT();
  const insets = useSafeAreaInsets();
  const { user, session, role, isLoading } = useAuthStore();
  const [craftCount, setCraftCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);

  // Guard: If a buyer ever navigates here, redirect immediately to buyer feed
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  // Dynamic uppercase formatted date (e.g., "WED, 9 SEP")
  const currentDateStr = new Date()
    .toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .toUpperCase();

  const artisanName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Artisan';

  const isFetchingRef = React.useRef(false);

  // Reload whenever the Home tab is opened so new items show up right away
  useFocusEffect(useCallback(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const loadStats = async () => {
      try {
        const baseApi = getApiBaseUrl();
        const state = useAuthStore.getState();
        const token = state.session?.access_token;
        if (token) {
          // Only this artisan's own items (archived ones are not counted)
          const res = await fetch(`${baseApi}/catalog/my-crafts`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setCraftCount(data.filter((c: any) => c.status !== 'ARCHIVED').length);
            }
          }

          const ordersRes = await fetch(`${baseApi}/orders/artisan`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            if (Array.isArray(ordersData)) {
              const pending = ordersData.filter(
                (o: any) => o.status === 'PENDING',
              ).length;
              setPendingOrdersCount(pending);

              const sales = ordersData.reduce(
                (sum: number, o: any) => sum + (Number(o.totalAmount) || 0),
                0,
              );
              setTotalSales(sales);
            }
          }
        }
      } catch (err) {
        // Graceful handling if network is unreachable
      } finally {
        clearTimeout(timeoutId);
        isFetchingRef.current = false;
      }
    };
    loadStats();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []));

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 8 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting + profile */}
        <View className="mb-5 flex-row items-center">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-artisan-muted">{currentDateStr}</Text>
            <Text className="text-2xl font-bold text-artisan-slate" numberOfLines={1}>
              {t('home.greeting', { name: artisanName })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.navigate('/(app)/profile')}
            activeOpacity={0.8}
            accessibilityLabel="Profile"
            className="h-14 w-14 items-center justify-center rounded-full border-2 border-artisan-primary bg-artisan-light"
          >
            <Text className="text-2xl font-bold text-artisan-primary">
              {artisanName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main action */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/capture/image')}
          activeOpacity={0.85}
          className="mb-6 flex-row items-center rounded-2xl bg-artisan-primary p-5"
        >
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Camera color="#FFFFFF" size={36} />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-2xl font-bold text-white">{t('home.addNew')}</Text>
            <Text className="text-base text-white">{t('home.addNewSub')}</Text>
          </View>
          <ChevronRight color="#FFFFFF" size={30} />
        </TouchableOpacity>

        {/* Numbers */}
        <SectionTitle
          title={t('home.summary')}
          right={
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/orders')}
              className="h-10 flex-row items-center px-2"
            >
              <Text className="text-base font-bold text-artisan-primary">{t('home.seeAll')}</Text>
              <ChevronRight color={COLORS.primary} size={18} />
            </TouchableOpacity>
          }
        />
        <View className="mb-3 flex-row" style={{ gap: 12 }}>
          <StatTile
            icon={Package}
            value={craftCount}
            label={t('home.items')}
            onPress={() => router.navigate('/(app)/catalog')}
          />
          <StatTile
            icon={ShoppingBag}
            value={pendingOrdersCount}
            label={t('home.newOrders')}
            color={COLORS.amber}
            onPress={() => router.navigate('/(app)/orders')}
          />
        </View>
        <TouchableOpacity
          onPress={() => router.navigate('/(app)/orders')}
          activeOpacity={0.8}
          className="mb-6 flex-row items-center rounded-2xl border border-green-200 bg-green-50 p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <IndianRupee color={COLORS.success} size={26} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-artisan-success">{t('home.earnings')}</Text>
            <Text className="text-3xl font-bold text-green-900">
              ₹{totalSales.toLocaleString('en-IN')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Shortcuts */}
        <SectionTitle title={t('home.goTo')} />
        <ShortcutRow
          icon={Package}
          title={t('tabs.myItems')}
          onPress={() => router.navigate('/(app)/catalog')}
        />
        <ShortcutRow
          icon={ShoppingBag}
          title={t('home.seeOrders')}
          onPress={() => router.navigate('/(app)/orders')}
        />
      </ScrollView>
    </View>
  );
}

function ShortcutRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof Package;
  title: string;
    subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mb-3 flex-row items-center rounded-2xl border border-artisan-border bg-white p-4"
    >
      <View className="h-14 w-14 items-center justify-center rounded-xl bg-artisan-light">
        <Icon color={COLORS.primary} size={28} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-xl font-bold text-artisan-slate">{title}</Text>
        {subtitle ? <Text className="text-base text-artisan-muted">{subtitle}</Text> : null}
      </View>
      <ChevronRight color={COLORS.muted} size={26} />
    </TouchableOpacity>
  );
}
