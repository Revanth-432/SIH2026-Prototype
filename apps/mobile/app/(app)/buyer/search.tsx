import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/useAuthStore';
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  MapPin,
  Tag,
  ShoppingBag,
  Clock,
  ArrowRight,
  ShoppingCart,
  Zap,
  CheckCircle2,
  Minus,
  Plus,
} from 'lucide-react-native';
import { getApiBaseUrl } from '../../../src/lib/api';
import { useCartStore } from '../../../src/store/useCartStore';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  craftType?: string | null;
  shortDescription?: string | null;
  materials?: string | null;
  artisanName: string;
  artisanRegion?: string | null;
  price?: number | null;
  currency: string;
  thumbnailUrl: string | null;
  marketingUrl?: string | null;
  similarityScore?: number;
  baseStock?: number;
}

const QUICK_TAGS = [
  'Terracotta Diya',
  'Silk Banarasi Saree',
  'Dokra Brass Figurine',
  'Madhubani Art',
  'Kashmiri Shawl',
  'Clay Pots',
];

export default function BuyerSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role === 'ARTISAN') {
      router.replace('/(app)/dashboard');
    }
  }, [role, isLoading, router]);

  const { addToCart, updateQuantity, items: cartItems } = useCartStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);


  const getBaseApiUrl = () => {
    return getApiBaseUrl();
  };

  const executeSearch = async (text: string) => {
    if (!text || !text.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `${getBaseApiUrl()}/marketplace/search?q=${encodeURIComponent(text.trim())}`,
      );
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.warn('Semantic search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    // Debounce search by 400ms
    searchTimeout.current = setTimeout(() => {
      executeSearch(text);
    }, 400);
  };

  const handleTagPress = (tag: string) => {
    setQuery(tag);
    Keyboard.dismiss();
    executeSearch(tag);
  };

  const renderResultCard = ({ item }: { item: SearchResult }) => {
    const matchPercent = item.similarityScore
      ? Math.round(item.similarityScore * 100)
      : null;

    const cartItem = cartItems.find((i) => i.id === item.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const maxLimit = item.baseStock || 10;

    return (
      <View className="mb-4 overflow-hidden rounded-3xl border border-artisan-border bg-white shadow-sm p-3">
        <TouchableOpacity
          onPress={() => router.push(`/(app)/buyer/product/${item.id}` as any)}
          activeOpacity={0.88}
          className="flex-row"
        >
          {/* Thumbnail */}
          <View className="relative h-28 w-28 overflow-hidden rounded-2xl bg-slate-100">
            {item.thumbnailUrl || item.marketingUrl ? (
              <Image
                source={{ uri: item.thumbnailUrl || item.marketingUrl || '' }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-orange-50">
                <ShoppingBag color="#C85A32" size={32} />
              </View>
            )}
          </View>

          {/* Details */}
          <View className="ml-3 flex-1 justify-between">
            <View>
              {/* Category & Similarity Badge */}
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-wider text-artisan-primary">
                  {item.craftType || item.category}
                </Text>
                {Boolean(matchPercent && matchPercent > 0) ? (
                  <View className="flex-row items-center rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    <Sparkles color="#059669" size={10} />
                    <Text className="ml-1 text-[10px] font-extrabold text-emerald-700">
                      {matchPercent}% Match
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                className="mt-1 text-base font-bold text-artisan-slate"
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <Text className="text-xs text-artisan-muted" numberOfLines={1}>
                By {item.artisanName}
                {item.artisanRegion ? ` • ${item.artisanRegion}` : ''}
              </Text>
            </View>

            {/* Price */}
            <View className="mt-1">
              <Text className="text-lg font-black text-green-800">
                ₹{item.price || 499}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons: Add to Cart (with - count + stepper) & Order Now */}
        <View className="mt-3 flex-row items-center pt-2.5 border-t border-slate-100">
          {inCartQty === 0 ? (
            <TouchableOpacity
              onPress={() => {
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
              }}
              className="flex-1 h-11 flex-row items-center justify-center rounded-xl mr-2 border bg-orange-50 border-orange-200 active:bg-orange-100"
            >
              <ShoppingCart color="#C85A32" size={15} />
              <Text className="ml-1 text-xs font-bold text-artisan-primary">
                Add to Cart
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-1 h-11 flex-row items-center justify-between rounded-xl mr-2 border border-artisan-primary/40 bg-orange-50 px-2">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, inCartQty - 1, maxLimit)}
                className="h-7 w-7 items-center justify-center rounded-lg bg-white border border-orange-200 active:bg-orange-100"
                activeOpacity={0.7}
              >
                <Minus color="#C85A32" size={13} />
              </TouchableOpacity>

              <View className="items-center justify-center px-1">
                <Text className="text-xs font-black text-artisan-slate">
                  {inCartQty} in cart
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (inCartQty >= maxLimit) {
                    Alert.alert(
                      'Max Order Limit',
                      `Maximum ${maxLimit} units can be ordered for this craft.`,
                    );
                    return;
                  }
                  updateQuantity(item.id, inCartQty + 1, maxLimit);
                }}
                className="h-7 w-7 items-center justify-center rounded-lg bg-artisan-primary active:bg-orange-700"
                activeOpacity={0.7}
              >
                <Plus color="#FFFFFF" size={13} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(app)/buyer/checkout',
                params: { productId: item.id },
              } as any)
            }
            className="flex-1 h-11 flex-row items-center justify-center rounded-xl bg-artisan-primary shadow-sm"
          >
            <Zap color="#FFFFFF" size={15} />
            <Text className="ml-1 text-xs font-black text-white">
              Order Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      {/* Search Header */}
      <View className="border-b border-artisan-border bg-white px-4 pt-3 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mr-2"
          >
            <ArrowLeft color="#1E293B" size={22} />
          </TouchableOpacity>

          {/* Search Input */}
          <View className="h-14 flex-1 flex-row items-center rounded-2xl border-2 border-artisan-primary bg-slate-50 px-3">
            <Search color="#C85A32" size={20} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search with natural language..."
              placeholderTextColor="#94A3B8"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => executeSearch(query)}
              className="ml-2.5 flex-1 text-base font-semibold text-artisan-slate"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                }}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-200"
              >
                <X color="#64748B" size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* AI Vector Search Indicator */}
        <View className="mt-3 flex-row items-center">
          <Sparkles color="#C85A32" size={14} />
          <Text className="ml-1.5 text-xs font-semibold text-artisan-primary">
            AI Smart Search • pgvector semantic cosine matching
          </Text>
        </View>

        {/* Quick Suggestion Tags */}
        <View className="mt-3 flex-row flex-wrap">
          {QUICK_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleTagPress(tag)}
              className="mb-1.5 mr-2 rounded-xl border border-artisan-border bg-slate-50 px-3 py-1.5 active:bg-orange-50"
            >
              <Text className="text-xs font-medium text-slate-700">{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C85A32" />
          <Text className="mt-3 text-sm font-bold text-artisan-slate">
            Searching artisan crafts with AI...
          </Text>
          <Text className="mt-1 text-xs text-artisan-muted">
            Matching craft style, materials, and regional heritage
          </Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-50">
            <ShoppingBag color="#C85A32" size={36} />
          </View>
          <Text className="mt-4 text-lg font-bold text-artisan-slate text-center">
            No Crafts Found
          </Text>
          <Text className="mt-2 text-center text-sm text-artisan-muted">
            We couldn't find any crafts matching "{query}". Try searching for materials like "clay", "silk", "wood", or craft names.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultCard}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            searched && results.length > 0 ? (
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-600">
                  {results.length} Craft{results.length > 1 ? 's' : ''} Discovered
                </Text>
                <Text className="text-xs text-artisan-muted">
                  Ranked by Relevance
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !searched ? (
              <View className="items-center justify-center p-8 mt-6">
                <Text className="text-base font-bold text-artisan-slate text-center">
                  Search Authentic Indian Crafts
                </Text>
                <Text className="mt-2 text-center text-xs text-artisan-muted leading-5">
                  Type what you are looking for in everyday words, e.g. "gift for housewarming", "traditional wall decor", or "terracotta lamp".
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
