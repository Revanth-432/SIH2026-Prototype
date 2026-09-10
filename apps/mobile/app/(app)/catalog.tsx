import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Package,
  Camera,
  Sparkles,
  Trash2,
  PauseCircle,
  Play,
  Eye,
} from 'lucide-react-native';
import { getApiBaseUrl } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';

interface CraftItem {
  id: string;
  title: string;
  category: string;
  craftType?: string | null;
  shortDescription?: string | null;
  price?: number | null;
  thumbnailUrl: string | null;
  status: string;
  baseStock?: number;
}

export default function CatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, session, isLoading } = useAuthStore();
  const [crafts, setCrafts] = useState<CraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PUBLISHED' | 'ARCHIVED' | 'IN_REVIEW'>('ALL');

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  const isFetchingRef = React.useRef(false);

  // Fetch only crafts uploaded by current authenticated artisan
  const fetchCrafts = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);



    try {
      const baseUrl = getApiBaseUrl();
      const state = useAuthStore.getState();
      let token = state.session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token;
      }

      if (!token) {
        setCrafts([]);
        return;
      }

      const res = await fetch(`${baseUrl}/catalog/my-crafts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCrafts(data);
        }
      } else {
        console.warn('Failed to load artisan crafts, status:', res.status);
      }
    } catch (err: any) {
      console.warn('Failed to load crafts in catalog:', err?.message || err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCrafts(false);
    }, [fetchCrafts]),
  );


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCrafts(true);
  }, [fetchCrafts]);

  // Toggle Discontinue / Re-list
  const handleToggleStatus = async (craft: CraftItem) => {
    const newStatus = craft.status === 'ARCHIVED' ? 'PUBLISHED' : 'ARCHIVED';
    const actionLabel =
      craft.status === 'ARCHIVED'
        ? 'Re-list / पुनः चालू करें'
        : 'Discontinue / बंद करें';

    // Optimistic update
    setCrafts((prev) =>
      prev.map((c) => (c.id === craft.id ? { ...c, status: newStatus } : c)),
    );

    try {
      const baseUrl = getApiBaseUrl();
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token;
      }

      const res = await fetch(`${baseUrl}/catalog/${craft.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch (err: any) {
      // Revert optimistic update
      setCrafts((prev) =>
        prev.map((c) => (c.id === craft.id ? { ...c, status: craft.status } : c)),
      );
      Alert.alert(
        'त्रुटि (Error)',
        `Could not perform "${actionLabel}". Please check your internet connection.`,
      );
    }
  };

  // Delete Craft permanently
  const handleDeleteCraft = (craft: CraftItem) => {
    Alert.alert(
      'Delete Craft? • शिल्प हटाएं?',
      `Are you sure you want to permanently delete "${craft.title}"? Buyers will no longer be able to find or order this craft.`,
      [
        { text: 'Cancel / रद्द', style: 'cancel' },
        {
          text: 'Delete / हटाएं',
          style: 'destructive',
          onPress: async () => {
            setCrafts((prev) => prev.filter((c) => c.id !== craft.id));
            try {
              const baseUrl = getApiBaseUrl();
              let token = session?.access_token;
              if (!token) {
                const { data: sessionData } = await supabase.auth.getSession();
                token = sessionData.session?.access_token;
              }

              const res = await fetch(`${baseUrl}/catalog/${craft.id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                throw new Error('Failed to delete craft');
              }
            } catch (err: any) {
              fetchCrafts(true);
              Alert.alert('Error', 'Could not delete craft. Please try again.');
            }
          },
        },
      ],
    );
  };

  const filteredCrafts = crafts.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    return c.status === selectedFilter;
  });

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
    >
      {/* Top Header */}
      <View className="border-b border-artisan-border bg-white px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-black text-artisan-slate">
              My Crafts • मेरा कैटलॉग
            </Text>
            <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
              Only your handmade items appear here ({crafts.length} total)
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(app)/capture/image')}
            activeOpacity={0.8}
            className="flex-row items-center rounded-2xl bg-artisan-primary px-3.5 py-2.5 shadow-sm active:bg-artisan-dark"
          >
            <Camera color="#FFFFFF" size={16} />
            <Text className="ml-1.5 text-xs font-black text-white">
              + New Craft
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View className="mt-4 flex-row flex-wrap gap-y-2">
          <TouchableOpacity
            onPress={() => setSelectedFilter('ALL')}
            activeOpacity={0.8}
            className={`rounded-xl px-3.5 py-1.5 mr-2 border ${
              selectedFilter === 'ALL'
                ? 'bg-artisan-primary border-artisan-primary'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedFilter === 'ALL' ? 'text-white' : 'text-slate-600'
              }`}
            >
              All ({crafts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter('PUBLISHED')}
            activeOpacity={0.8}
            className={`rounded-xl px-3.5 py-1.5 mr-2 border ${
              selectedFilter === 'PUBLISHED'
                ? 'bg-artisan-primary border-artisan-primary'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedFilter === 'PUBLISHED' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Live / सक्रिय ({crafts.filter((c) => c.status === 'PUBLISHED').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter('ARCHIVED')}
            activeOpacity={0.8}
            className={`rounded-xl px-3.5 py-1.5 mr-2 border ${
              selectedFilter === 'ARCHIVED'
                ? 'bg-artisan-primary border-artisan-primary'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedFilter === 'ARCHIVED' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Discontinued / बंद ({crafts.filter((c) => c.status === 'ARCHIVED').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter('IN_REVIEW')}
            activeOpacity={0.8}
            className={`rounded-xl px-3.5 py-1.5 border ${
              selectedFilter === 'IN_REVIEW'
                ? 'bg-artisan-primary border-artisan-primary'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedFilter === 'IN_REVIEW' ? 'text-white' : 'text-slate-600'
              }`}
            >
              In Review ({crafts.filter((c) => c.status === 'IN_REVIEW').length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 110,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C85A32']}
            tintColor="#C85A32"
          />
        }
      >
        {/* Fast Action Banner: AI Studio Upload */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/capture/image')}
          activeOpacity={0.85}
          className="mb-5 flex-row items-center rounded-3xl bg-orange-50 border-2 border-artisan-primary/30 p-4 shadow-sm"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-artisan-primary">
            <Sparkles color="#FFFFFF" size={24} />
          </View>
          <View className="ml-3.5 flex-1 pr-1">
            <View className="flex-row items-center">
              <Text className="text-base font-extrabold text-artisan-slate">
                Smart AI Cataloging
              </Text>
              <View className="ml-2 rounded bg-amber-500 px-1.5 py-0.5">
                <Text className="text-[9px] font-black text-white uppercase tracking-wider">
                  Voice + Camera
                </Text>
              </View>
            </View>
            <Text className="text-xs font-bold text-artisan-amber mt-0.5">
              फोटो खींचें और बोलकर विवरण बनाएं
            </Text>
          </View>
          <Plus color="#C85A32" size={20} />
        </TouchableOpacity>

        {/* Crafts List */}
        {loading && crafts.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#C85A32" />
            <Text className="mt-3 text-sm font-semibold text-artisan-muted">
              Loading your crafts... / आपके उत्पाद लोड हो रहे हैं...
            </Text>
          </View>
        ) : filteredCrafts.length === 0 ? (
          <View className="rounded-3xl border border-artisan-border bg-white p-8 items-center text-center shadow-sm my-4">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
              <Package color="#C85A32" size={32} />
            </View>
            <Text className="mt-4 text-lg font-bold text-artisan-slate">
              {selectedFilter === 'ALL'
                ? 'You Have No Crafts Listed Yet'
                : `No ${selectedFilter} Crafts Found`}
            </Text>
            <Text className="mt-1 text-center text-xs text-artisan-muted leading-5">
              Start by photographing your handmade art. Only products you upload will appear in this workspace.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/capture/image')}
              activeOpacity={0.85}
              className="mt-5 rounded-2xl bg-artisan-primary px-5 py-3 shadow-md"
            >
              <Text className="text-sm font-bold text-white">
                Catalog Your First Craft / पहला शिल्प जोड़ें
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {filteredCrafts.map((craft) => {
              const isArchived = craft.status === 'ARCHIVED';
              const isPublished = craft.status === 'PUBLISHED';

              return (
                <View
                  key={craft.id}
                  className={`rounded-3xl border bg-white p-4 shadow-sm mb-4 ${
                    isArchived
                      ? 'border-slate-200 opacity-90'
                      : 'border-artisan-border'
                  }`}
                >
                  {/* Top: Image & Info */}
                  <View className="flex-row items-center">
                    {/* Thumbnail */}
                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/(app)/product/${craft.id}` as any)
                      }
                      activeOpacity={0.85}
                      className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200"
                    >

                      {craft.thumbnailUrl ? (
                        <Image
                          source={{ uri: craft.thumbnailUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-orange-50">
                          <Package color="#C85A32" size={28} />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Details */}
                    <View className="ml-3.5 flex-1 justify-between py-0.5">
                      <View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11px] font-bold uppercase tracking-wider text-artisan-primary">
                            {craft.craftType || craft.category || 'Craft Item'}
                          </Text>

                          {/* Status Badge */}
                          <View
                            className={`rounded-full px-2.5 py-0.5 border ${
                              isPublished
                                ? 'bg-emerald-50 border-emerald-300'
                                : isArchived
                                  ? 'bg-slate-100 border-slate-300'
                                  : 'bg-amber-50 border-amber-300'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black ${
                                isPublished
                                  ? 'text-emerald-700'
                                  : isArchived
                                    ? 'text-slate-600'
                                    : 'text-amber-800'
                              }`}
                            >
                              {isPublished
                                ? 'Live / सक्रिय'
                                : isArchived
                                  ? 'Discontinued / बंद'
                                  : 'In Review'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className="mt-1 text-base font-extrabold text-artisan-slate"
                          numberOfLines={1}
                        >
                          {craft.title}
                        </Text>
                      </View>

                      {/* Price & Max Order Limit */}
                      <View className="mt-2 flex-row items-center justify-between">
                        <Text className="text-base font-black text-green-700">
                          ₹{craft.price || 499}
                        </Text>

                        <View className="rounded-lg bg-orange-50 px-2 py-0.5 border border-orange-200">
                          <Text className="text-[10px] font-bold text-artisan-primary">
                            Max Limit: {craft.baseStock || 10} units
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Actions: Preview, Discontinue/Re-list, Delete */}
                  <View className="mt-3 pt-3 border-t border-slate-100 flex-row flex-wrap items-center justify-between gap-2">
                    {/* View Preview Button (Artisan Studio View) */}
                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/(app)/product/${craft.id}` as any)
                      }
                      activeOpacity={0.7}
                      className="flex-row items-center py-1 px-2"
                    >
                      <Eye color="#64748B" size={14} />
                      <Text className="ml-1 text-xs font-bold text-slate-600">
                        View Studio / विवरण
                      </Text>
                    </TouchableOpacity>


                    <View className="flex-row flex-wrap items-center gap-2">
                      {/* Discontinue / Re-list Button */}
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(craft)}
                        activeOpacity={0.8}
                        className={`flex-row items-center rounded-xl px-3 py-1.5 border ${
                          isArchived
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-amber-50 border-amber-300'
                        }`}
                      >
                        {isArchived ? (
                          <>
                            <Play color="#059669" size={13} />
                            <Text className="ml-1.5 text-xs font-black text-emerald-800">
                              Re-list / चालू करें
                            </Text>
                          </>
                        ) : (
                          <>
                            <PauseCircle color="#D97706" size={13} />
                            <Text className="ml-1.5 text-xs font-black text-amber-800">
                              Discontinue / बंद करें
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteCraft(craft)}
                        activeOpacity={0.8}
                        className="flex-row items-center rounded-xl bg-red-50 border border-red-200 px-3 py-1.5"
                      >
                        <Trash2 color="#EF4444" size={13} />
                        <Text className="ml-1 text-xs font-black text-red-600">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
