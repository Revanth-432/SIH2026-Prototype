import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Sparkles,
  ShoppingBag,
  LogOut,
  SlidersHorizontal,
  ShoppingCart,
  Zap,
  X,
  Check,
  RotateCcw,
  CheckCircle2,
  Minus,
  Plus,
} from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useCartStore } from '../../../src/store/useCartStore';
import { getApiBaseUrl } from '../../../src/lib/api';

interface FeedItem {
  id: string;
  title: string;
  category: string;
  craftType?: string | null;
  shortDescription?: string | null;
  artisanName: string;
  artisanRegion?: string | null;
  price?: number | null;
  currency: string;
  thumbnailUrl: string | null;
  marketingUrl?: string | null;
  baseStock?: number;
}

type PriceFilter = 'ALL' | 'UNDER_1000' | '1000_TO_5000' | 'ABOVE_5000';
type SortOption = 'DEFAULT' | 'PRICE_LOW' | 'PRICE_HIGH';

export default function BuyerFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, role, isLoading } = useAuthStore();
  const { addToCart, updateQuantity, items: cartItems, getTotalCount } = useCartStore();

  // Role Protection Guard: Artisans must never access Buyer Feed
  useEffect(() => {
    if (!isLoading && role === 'ARTISAN') {
      router.replace('/(app)/dashboard');
    }
  }, [role, isLoading, router]);

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  // Filter & Sort States (dynamically populated from currently available products)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<PriceFilter>('ALL');
  const [selectedSort, setSelectedSort] = useState<SortOption>('DEFAULT');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const cartCount = getTotalCount();

  const fetchFeed = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/marketplace/feed`);
      if (res.ok) {
        const data: FeedItem[] = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch marketplace feed from backend:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  // 1. Dynamically extract currently available categories from products in the portal
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const cat = item.craftType || item.category;
      if (cat && cat.trim()) {
        set.add(cat.trim());
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [items]);

  // 2. Filter & Sort products as per user selection
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category Filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (item) =>
          (item.craftType && item.craftType.trim() === selectedCategory) ||
          (item.category && item.category.trim() === selectedCategory),
      );
    }

    // Price Filter
    if (selectedPriceFilter === 'UNDER_1000') {
      result = result.filter((item) => (item.price || 0) < 1000);
    } else if (selectedPriceFilter === '1000_TO_5000') {
      result = result.filter(
        (item) => (item.price || 0) >= 1000 && (item.price || 0) <= 5000,
      );
    } else if (selectedPriceFilter === 'ABOVE_5000') {
      result = result.filter((item) => (item.price || 0) > 5000);
    }

    // Sorting
    if (selectedSort === 'PRICE_LOW') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (selectedSort === 'PRICE_HIGH') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [items, selectedCategory, selectedPriceFilter, selectedSort]);

  const hasActiveFilter =
    selectedCategory !== 'ALL' ||
    selectedPriceFilter !== 'ALL' ||
    selectedSort !== 'DEFAULT';

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedPriceFilter('ALL');
    setSelectedSort('DEFAULT');
  };

  // Quick Add to Cart Handler
  const handleAddToCart = (item: FeedItem) => {
    const maxLimit = item.baseStock || 10;
    addToCart(
      {
        id: item.id,
        title: item.title,
        price: item.price || 499,
        thumbnailUrl: item.thumbnailUrl || item.marketingUrl || null,
        artisanName: item.artisanName,
        category: item.craftType || item.category,
        maxOrderLimit: maxLimit,
      },
      1,
      maxLimit,
    );
  };

  // Quick Order Now Handler
  const handleOrderNow = (item: FeedItem) => {
    router.push({
      pathname: '/(app)/buyer/checkout',
      params: { productId: item.id },
    } as any);
  };

  const renderCraftCard = ({ item }: { item: FeedItem }) => {
    const cartItem = cartItems.find((i) => i.id === item.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const maxLimit = item.baseStock || 10;

    return (
      <View className="mb-5 overflow-hidden rounded-3xl border border-artisan-border bg-white shadow-sm">
        {/* Product Image Touchable (navigates to details) */}
        <TouchableOpacity
          onPress={() => router.push(`/(app)/buyer/product/${item.id}` as any)}
          activeOpacity={0.9}
        >
          <View className="relative h-64 w-full bg-slate-50">
            {item.thumbnailUrl || item.marketingUrl ? (
              <Image
                source={{ uri: item.thumbnailUrl || item.marketingUrl || '' }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-orange-50">
                <ShoppingBag color="#C85A32" size={48} />
              </View>
            )}

            {/* Craft Type Badge */}
            <View className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 shadow-sm border border-slate-100">
              <Text className="text-xs font-extrabold text-artisan-primary">
                {item.craftType || item.category}
              </Text>
            </View>

            {/* Region Badge */}
            {Boolean(item.artisanRegion) ? (
              <View className="absolute bottom-3 left-3 flex-row items-center rounded-full bg-slate-900/80 px-2.5 py-1">
                <MapPin color="#FFFFFF" size={12} />
                <Text className="ml-1 text-xs font-medium text-white">
                  {item.artisanRegion}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Product Details */}
        <View className="p-4">
          <TouchableOpacity
            onPress={() =>
              router.push(`/(app)/buyer/product/${item.id}` as any)
            }
            activeOpacity={0.8}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text
                  className="text-lg font-black text-artisan-slate"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="mt-0.5 text-xs text-artisan-muted font-medium">
                  By {item.artisanName || 'Heritage Artisan'}
                </Text>
              </View>

              {/* Price */}
              <View className="rounded-xl bg-green-50 px-2.5 py-1.5 border border-green-200">
                <Text className="text-base font-black text-green-800">
                  ₹{item.price || 499}
                </Text>
              </View>
            </View>

            {Boolean(item.shortDescription) ? (
              <Text className="mt-2 text-xs text-slate-600 leading-relaxed" numberOfLines={2}>
                {item.shortDescription}
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* TWO ACTIONS: Add to Cart (with - count + stepper) & Order Now */}
          <View className="mt-4 flex-row items-center pt-3 border-t border-slate-100">
            {/* Option 1: Add to Cart OR Interactive Stepper (- count +) */}
            {inCartQty === 0 ? (
              <TouchableOpacity
                onPress={() => handleAddToCart(item)}
                activeOpacity={0.82}
                className="flex-1 h-12 flex-row items-center justify-center rounded-2xl mr-2.5 border bg-orange-50/80 border-orange-200 active:bg-orange-100"
              >
                <ShoppingCart color="#C85A32" size={17} />
                <Text className="ml-1.5 text-xs font-extrabold text-artisan-primary">
                  Add to Cart / कार्ट
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-1 h-12 flex-row items-center justify-between rounded-2xl mr-2.5 border border-artisan-primary/40 bg-orange-50 px-2">
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, inCartQty - 1, maxLimit)}
                  className="h-8 w-8 items-center justify-center rounded-xl bg-white border border-orange-200 active:bg-orange-100"
                  activeOpacity={0.7}
                >
                  <Minus color="#C85A32" size={15} />
                </TouchableOpacity>

                <View className="items-center justify-center px-1">
                  <Text className="text-sm font-black text-artisan-slate">
                    {inCartQty}
                  </Text>
                  <Text className="text-[9px] font-bold text-artisan-primary">
                    in cart
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (inCartQty >= maxLimit) {
                      Alert.alert(
                        'सीमा समाप्त (Max Order Limit)',
                        `Artisan allows maximum ${maxLimit} units for this craft.`,
                      );
                      return;
                    }
                    updateQuantity(item.id, inCartQty + 1, maxLimit);
                  }}
                  className="h-8 w-8 items-center justify-center rounded-xl bg-artisan-primary active:bg-orange-700"
                  activeOpacity={0.7}
                >
                  <Plus color="#FFFFFF" size={15} />
                </TouchableOpacity>
              </View>
            )}

            {/* Option 2: Order Now */}
            <TouchableOpacity
              onPress={() => handleOrderNow(item)}
              activeOpacity={0.88}
              className="flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-sm shadow-orange-900/20 active:bg-orange-700"
            >
              <Zap color="#FFFFFF" size={17} />
              <Text className="ml-1.5 text-xs font-black text-white">
                Order Now / खरीदें
              </Text>
            </TouchableOpacity>
          </View>
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
          <View>
            <View className="flex-row items-center">
              <Sparkles color="#C85A32" size={22} />
              <Text className="ml-1.5 text-2xl font-black text-artisan-slate">
                Kala Bazaar
              </Text>
            </View>
            <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
              कला बाज़ार • Authentic Indian Artisans
            </Text>
          </View>

          {/* Cart Icon & Sign Out Action (NO Artisan Hub button for buyers!) */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/cart')}
              className="relative h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 mr-2 active:bg-orange-100"
              activeOpacity={0.8}
            >
              <ShoppingCart color="#C85A32" size={20} />
              {cartCount > 0 ? (
                <View className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-artisan-primary items-center justify-center border border-white">
                  <Text className="text-[10px] font-black text-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => signOut()}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 active:bg-slate-200"
              activeOpacity={0.8}
            >
              <LogOut color="#64748B" size={19} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar & Filter Button Row */}
        <View className="mt-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push('/(app)/buyer/search')}
            activeOpacity={0.85}
            className="h-13 flex-1 flex-row items-center rounded-2xl border-2 border-artisan-border bg-slate-50 px-4 mr-2"
          >
            <Search color="#C85A32" size={20} />
            <Text className="ml-2.5 flex-1 text-sm text-artisan-muted font-medium">
              Search "terracotta", "pottery", "crafts"...
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
            className={`h-13 w-13 items-center justify-center rounded-2xl border-2 ${
              hasActiveFilter
                ? 'bg-artisan-primary border-artisan-primary'
                : 'bg-white border-artisan-border'
            }`}
          >
            <SlidersHorizontal
              color={hasActiveFilter ? '#FFFFFF' : '#C85A32'}
              size={20}
            />
          </TouchableOpacity>
        </View>

        {/* Dynamic Category Chips from currently available portal products */}
        {availableCategories.length > 1 && (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 12 }}
          >
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  className={`rounded-xl px-3.5 py-1.5 border ${
                    isSelected
                      ? 'bg-artisan-primary border-artisan-primary'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Crafts / सभी' : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Active Filter Notice Bar */}
        {hasActiveFilter && (
          <View className="mt-2.5 flex-row items-center justify-between rounded-xl bg-orange-50 px-3 py-1.5 border border-orange-200">
            <Text className="text-xs font-bold text-artisan-primary">
              Filtered: {selectedCategory !== 'ALL' ? selectedCategory : ''}{' '}
              {selectedPriceFilter !== 'ALL' ? `(${selectedPriceFilter})` : ''} •{' '}
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Text>
            <TouchableOpacity
              onPress={handleResetFilters}
              className="flex-row items-center"
            >
              <RotateCcw color="#C85A32" size={12} />
              <Text className="ml-1 text-xs font-extrabold text-artisan-primary">
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feed List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C85A32" />
          <Text className="mt-3 text-sm font-bold text-artisan-slate">
            Loading Artisan Crafts...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderCraftCard}
          contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
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
              <ShoppingBag color="#C85A32" size={48} />
              <Text className="mt-4 text-lg font-black text-artisan-slate text-center">
                No Products Match Your Filter
              </Text>
              <Text className="mt-2 text-center text-xs text-artisan-muted leading-5 max-w-xs">
                Try selecting "All Crafts" or resetting your price filter to discover all authentic items in the portal.
              </Text>
              <TouchableOpacity
                onPress={handleResetFilters}
                className="mt-4 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2"
              >
                <Text className="text-xs font-bold text-artisan-primary">
                  Clear All Filters / रीसेट करें
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-6 max-h-[85%]">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-4">
              <View>
                <Text className="text-xl font-black text-artisan-slate">
                  Filter Products • फ़िल्टर
                </Text>
                <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
                  Filter by currently available portal categories & price
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100"
              >
                <X color="#64748B" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              {/* Category Filter (From currently available products) */}
              <Text className="text-xs font-black uppercase tracking-wider text-artisan-slate mb-2.5">
                Categories in Portal • उपलब्ध श्रेणियाँ
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      className={`rounded-xl px-3.5 py-2 border ${
                        isSelected
                          ? 'bg-artisan-primary border-artisan-primary'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Categories / सभी' : cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Range Filter */}
              <Text className="text-xs font-black uppercase tracking-wider text-artisan-slate mb-2.5">
                Price Range • मूल्य सीमा
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {[
                  { id: 'ALL', label: 'All Prices / सभी' },
                  { id: 'UNDER_1000', label: 'Under ₹1,000' },
                  { id: '1000_TO_5000', label: '₹1,000 - ₹5,000' },
                  { id: 'ABOVE_5000', label: 'Above ₹5,000' },
                ].map((p) => {
                  const isSelected = selectedPriceFilter === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPriceFilter(p.id as PriceFilter)}
                      className={`rounded-xl px-3.5 py-2 border ${
                        isSelected
                          ? 'bg-artisan-primary border-artisan-primary'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sort By Filter */}
              <Text className="text-xs font-black uppercase tracking-wider text-artisan-slate mb-2.5">
                Sort By • क्रमबद्ध करें
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {[
                  { id: 'DEFAULT', label: 'Recommended / अनुशंसित' },
                  { id: 'PRICE_LOW', label: 'Price: Low to High' },
                  { id: 'PRICE_HIGH', label: 'Price: High to Low' },
                ].map((s) => {
                  const isSelected = selectedSort === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedSort(s.id as SortOption)}
                      className={`rounded-xl px-3.5 py-2 border ${
                        isSelected
                          ? 'bg-artisan-primary border-artisan-primary'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="flex-row items-center pt-3 border-t border-slate-100">
              <TouchableOpacity
                onPress={handleResetFilters}
                className="h-13 px-5 items-center justify-center rounded-2xl bg-slate-100 mr-3"
              >
                <Text className="text-xs font-bold text-slate-700">
                  Reset / रीसेट
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                className="h-13 flex-1 items-center justify-center rounded-2xl bg-artisan-primary shadow-md"
              >
                <Text className="text-sm font-black text-white">
                  Apply Filters ({filteredItems.length} Products)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
