import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Package,
  Camera,
  Trash2,
  EyeOff,
  Play,
  Eye,
} from 'lucide-react-native';
import { getApiBaseUrl } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { Text, Button, EmptyState, Loading, StatusChip, COLORS } from '../../src/components/ui';
import { useT } from '../../src/i18n';

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
  const { t, language } = useT();
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
                t('catalog.failedTitle'),
        t('common.checkInternet'),
      );
    }
  };

  // Delete Craft permanently
  const handleDeleteCraft = (craft: CraftItem) => {
    Alert.alert(
            t('catalog.deleteTitle'),
      t('catalog.deleteMsg', { title: craft.title }),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('catalog.deleteYes'),
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
              Alert.alert(t('catalog.deleteFailed'), t('common.checkInternet'));
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

  const filters: { key: typeof selectedFilter; label: string }[] = [
    { key: 'ALL', label: t('catalog.all', { n: crafts.length }) },
    { key: 'PUBLISHED', label: t('catalog.live', { n: crafts.filter((c) => c.status === 'PUBLISHED').length }) },
    { key: 'IN_REVIEW', label: t('catalog.review', { n: crafts.filter((c) => c.status === 'IN_REVIEW').length }) },
    { key: 'ARCHIVED', label: t('catalog.hidden', { n: crafts.filter((c) => c.status === 'ARCHIVED').length }) },
  ];

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 8 }}
    >
      {/* Header */}
      <View className="border-b border-artisan-border bg-white px-4 pb-3 pt-1">
        <View className="flex-row items-center">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-artisan-slate">{t('tabs.myItems')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/capture/image')}
            activeOpacity={0.8}
            className="h-12 flex-row items-center rounded-xl bg-artisan-primary px-4"
          >
            <Plus color="#FFFFFF" size={22} />
            <Text className="ml-1 text-base font-bold text-white">{t('catalog.add')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((f) => {
            const active = selectedFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setSelectedFilter(f.key)}
                activeOpacity={0.8}
                className="h-11 justify-center rounded-full px-4"
                style={{
                  backgroundColor: active ? COLORS.primary : '#F5F5F4',
                  borderWidth: 1,
                  borderColor: active ? COLORS.primary : COLORS.border,
                }}
              >
                <Text className="text-base font-semibold" style={{ color: active ? '#FFFFFF' : COLORS.ink }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 110,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {loading && crafts.length === 0 ? (
          <View key="loading">
            <Loading />
          </View>
        ) : filteredCrafts.length === 0 ? (
          <View key="empty">
            <EmptyState
              icon={Package}
              title={selectedFilter === 'ALL' ? t('catalog.emptyAll') : t('catalog.emptyFilter')}
              action={
                <Button
                  label={t('capture.takePhoto')}
                  icon={Camera}
                  onPress={() => router.push('/(app)/capture/image')}
                />
              }
            />
          </View>
        ) : (
          <View key="list">
            {filteredCrafts.map((craft) => {
              const isArchived = craft.status === 'ARCHIVED';

              return (
                <View
                  key={craft.id}
                  className="mb-3 rounded-2xl border border-artisan-border bg-white p-3"
                  style={{ opacity: isArchived ? 0.85 : 1 }}
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/product/${craft.id}` as any)}
                    activeOpacity={0.85}
                    className="flex-row"
                  >
                    <View className="h-24 w-24 overflow-hidden rounded-xl bg-stone-100">
                      {craft.thumbnailUrl ? (
                        <Image
                          source={{ uri: craft.thumbnailUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-artisan-light">
                          <Package color={COLORS.primary} size={32} />
                        </View>
                      )}
                    </View>

                    <View className="ml-3 flex-1">
                      <StatusChip status={craft.status} />
                      <Text className="mt-1 text-lg font-bold text-artisan-slate" numberOfLines={2}>
                        {craft.title}
                      </Text>
                      <View className="mt-1 flex-row items-baseline">
                        <Text className="text-2xl font-bold text-artisan-success">
                          ₹{craft.price || 499}
                        </Text>
                        <Text className="ml-2 text-sm text-artisan-muted">
                          {t('catalog.limit', { n: craft.baseStock || 10 })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View className="mt-3 flex-row border-t border-artisan-border pt-3" style={{ gap: 8 }}>
                    <ActionButton
                      icon={Eye}
                      label={t('catalog.view')}
                      color={COLORS.ink}
                      onPress={() => router.push(`/(app)/product/${craft.id}` as any)}
                    />
                    <ActionButton
                      icon={isArchived ? Play : EyeOff}
                      label={isArchived ? t('catalog.sellAgain') : t('catalog.hide')}
                      color={isArchived ? COLORS.success : COLORS.amber}
                      onPress={() => handleToggleStatus(craft)}
                    />
                    <ActionButton
                      icon={Trash2}
                      label={t('catalog.delete')}
                      color={COLORS.error}
                      onPress={() => handleDeleteCraft(craft)}
                    />
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

function ActionButton({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: typeof Eye;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="h-12 flex-1 flex-row items-center justify-center rounded-xl bg-stone-50"
      style={{ borderWidth: 1, borderColor: COLORS.border }}
    >
      <Icon color={color} size={20} />
      <Text className="ml-1.5 text-base font-bold" style={{ color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
