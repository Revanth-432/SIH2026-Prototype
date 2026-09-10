import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Package,
  ShoppingBag,
  Camera,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { getApiBaseUrl } from '../../src/lib/api';

export default function DashboardScreen() {
  const router = useRouter();
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
    .toLocaleDateString('en-US', {
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

  useEffect(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const loadStats = async () => {
      try {
        const baseApi = getApiBaseUrl();
        const res = await fetch(`${baseApi}/marketplace/feed?limit=30`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCraftCount(data.length);
          }
        }

        const state = useAuthStore.getState();
        const token = state.session?.access_token;
        if (token) {
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
  }, []);

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* TASK 1: Top Header Section with Generous Safe Area & Spacing */}
        <View className="px-5 mb-7">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              {/* Current Date */}
              <Text className="text-[11px] font-black uppercase tracking-widest text-artisan-muted">
                {currentDateStr}
              </Text>

              {/* Greeting */}
              <Text
                className="mt-1.5 text-2xl font-black text-artisan-slate leading-tight"
                numberOfLines={1}
              >
                नमस्ते, {artisanName}!
              </Text>

              <Text className="text-xs font-semibold text-artisan-muted mt-1">
                KalaSangam Artisan Hub • शिल्प केंद्र
              </Text>
            </View>

            {/* User Avatar Circle (aligned to far right, taps to Profile) */}
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/profile')}
              activeOpacity={0.8}
              className="relative"
            >
              <View
                className="items-center justify-center rounded-2xl bg-orange-100 border-2 border-artisan-primary shadow-sm"
                style={{ width: 52, height: 52 }}
              >
                <Text className="text-xl font-black text-artisan-primary">
                  {artisanName.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Online Active Badge */}
              <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TASK 2: De-congested Horizontal Analytics Cards */}
        <View className="mb-7">
          <View className="flex-row items-center justify-between px-5 mb-3.5">
            <Text className="text-sm font-extrabold uppercase tracking-wider text-artisan-muted">
              Business Overview • व्यापार सारांश
            </Text>
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/orders')}
              className="flex-row items-center py-1 px-2 rounded-lg active:bg-slate-100"
            >
              <Text className="text-xs font-bold text-artisan-primary mr-1">
                Details
              </Text>
              <ArrowUpRight color="#C85A32" size={13} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
          >
            {/* Card 1: Total Crafts (Featured Deep Terracotta) */}
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/catalog')}
              activeOpacity={0.88}
              className="w-64 rounded-3xl bg-artisan-primary p-6 shadow-md shadow-orange-900/15 justify-between"
            >
              <View className="flex-row items-center justify-between">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <Package color="#FFFFFF" size={22} />
                </View>
                <View className="rounded-full bg-white/20 px-3 py-1">
                  <Text className="text-[10px] font-black text-white uppercase tracking-wider">
                    Live
                  </Text>
                </View>
              </View>

              <View className="mt-5 mb-2">
                <Text className="text-3xl font-black text-white">
                  {craftCount}
                </Text>
                <Text className="text-xs font-bold text-orange-100 mt-1.5">
                  Total Crafts / कुल उत्पाद
                </Text>
              </View>

              <View className="pt-3 border-t border-white/15">
                <Text className="text-[11px] font-medium text-white/80 leading-relaxed">
                  +2 added this week • कैटलॉग सक्रिय
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Pending Orders (Warm Cream with Terracotta Border) */}
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/orders')}
              activeOpacity={0.88}
              className="w-64 rounded-3xl bg-white p-6 border border-artisan-border shadow-sm justify-between"
            >
              <View className="flex-row items-center justify-between">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
                  <ShoppingBag color="#C85A32" size={22} />
                </View>
                <View className="rounded-full bg-amber-100 px-3 py-1 border border-amber-300">
                  <Text className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                    Action / ज़रूरी
                  </Text>
                </View>
              </View>

              <View className="mt-5 mb-2">
                <Text className="text-3xl font-black text-artisan-slate">
                  {pendingOrdersCount}
                </Text>
                <Text className="text-xs font-bold text-slate-500 mt-1.5">
                  Pending Orders / लंबित ऑर्डर
                </Text>
              </View>

              <View className="pt-3 border-t border-slate-100">
                <Text className="text-[11px] font-bold text-artisan-primary leading-relaxed">
                  Awaiting packaging & dispatch
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 3: Total Earnings (Soft Emerald Card) */}
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/orders')}
              activeOpacity={0.88}
              className="w-64 rounded-3xl bg-emerald-50 p-6 border border-emerald-200 shadow-sm justify-between"
            >
              <View className="flex-row items-center justify-between">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                  <TrendingUp color="#059669" size={22} />
                </View>
                <View className="rounded-full bg-emerald-200/60 px-3 py-1">
                  <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                    Fair Wage
                  </Text>
                </View>
              </View>

              <View className="mt-5 mb-2">
                <Text className="text-3xl font-black text-emerald-900">
                  ₹{totalSales.toLocaleString('en-IN')}
                </Text>
                <Text className="text-xs font-bold text-emerald-700 mt-1.5">
                  Total Sales / कुल कमाई
                </Text>
              </View>

              <View className="pt-3 border-t border-emerald-200/50">
                <Text className="text-[11px] font-bold text-emerald-800 leading-relaxed">
                  100% direct artisan payouts
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* TASK 3: De-congested Action Menu Cards with Generous Spacing */}
        <View className="px-5">
          <Text className="mb-3.5 text-sm font-extrabold uppercase tracking-wider text-artisan-muted">
            Artisan Actions • मुख्य कार्य
          </Text>

          {/* Action 1: Smart Cataloging */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/capture/image')}
            activeOpacity={0.85}
            className="flex-row items-center rounded-3xl border border-artisan-border bg-white p-5 shadow-sm active:bg-orange-50/50 mb-4"
          >
            <View className="h-13 w-13 items-center justify-center rounded-2xl bg-orange-100" style={{ width: 50, height: 50 }}>
              <Camera color="#C85A32" size={24} />
            </View>

            <View className="ml-4 flex-1 pr-2 space-y-1.5">
              <View className="flex-row items-center">
                <Text className="text-base font-extrabold text-artisan-slate">
                  Smart AI Cataloging
                </Text>
                <View className="ml-2 rounded-md bg-artisan-primary px-2 py-0.5">
                  <Text className="text-[9px] font-black text-white uppercase tracking-wider">
                    AI Fast
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-artisan-amber">
                फोटो खींचें और AI विवरण बनाएं
              </Text>
              <Text className="text-[12px] text-artisan-muted leading-relaxed">
                Take photo & voice note to generate studio catalog
              </Text>
            </View>

            <ChevronRight color="#94A3B8" size={20} />
          </TouchableOpacity>

          {/* Action 2: Orders & Sales */}
          <TouchableOpacity
            onPress={() => router.navigate('/(app)/orders')}
            activeOpacity={0.85}
            className="flex-row items-center rounded-3xl border border-artisan-border bg-white p-5 shadow-sm active:bg-emerald-50/50 mb-4"
          >
            <View className="h-13 w-13 items-center justify-center rounded-2xl bg-emerald-100" style={{ width: 50, height: 50 }}>
              <ShoppingBag color="#059669" size={24} />
            </View>

            <View className="ml-4 flex-1 pr-2 space-y-1.5">
              <View className="flex-row items-center">
                <Text className="text-base font-extrabold text-artisan-slate">
                  Orders & Sales
                </Text>
                <View className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                  <Text className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">
                    Live
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-emerald-700">
                ग्राहक ऑर्डर देखें और पूरा करें
              </Text>
              <Text className="text-[12px] text-artisan-muted leading-relaxed">
                View incoming customer orders & fulfill directly
              </Text>
            </View>

            <ChevronRight color="#94A3B8" size={20} />
          </TouchableOpacity>

          {/* Action 3: My Crafts Catalog */}
          <TouchableOpacity
            onPress={() => router.navigate('/(app)/catalog')}
            activeOpacity={0.85}
            className="flex-row items-center rounded-3xl border border-artisan-border bg-white p-5 shadow-sm active:bg-amber-50/50 mb-4"
          >
            <View className="h-13 w-13 items-center justify-center rounded-2xl bg-amber-100" style={{ width: 50, height: 50 }}>
              <Package color="#D97706" size={24} />
            </View>

            <View className="ml-4 flex-1 pr-2 space-y-1.5">
              <Text className="text-base font-extrabold text-artisan-slate">
                My Crafts Catalog
              </Text>
              <Text className="text-xs font-bold text-artisan-amber">
                सभी कैटलॉग आइटम देखें
              </Text>
              <Text className="text-[12px] text-artisan-muted leading-relaxed">
                View, edit inventory & manage published crafts
              </Text>
            </View>

            <ChevronRight color="#94A3B8" size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
