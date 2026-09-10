import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import {
  Home,
  Package,
  ShoppingBag,
  User,
  Store,
  ShoppingCart,
} from 'lucide-react-native';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCartStore } from '../../src/store/useCartStore';

export default function AppLayout() {
  const { role, isLoading } = useAuthStore();
  const isBuyer = role === 'BUYER' || role === 'B2B_BUYER';
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const pathname = usePathname();

  // Hide the bottom tab bar when pushed onto full-screen sub-routes (product detail, checkout, quote, search, capture studio)
  const isSubRoute =
    pathname.includes('/buyer/product') ||
    pathname.includes('/buyer/checkout') ||
    pathname.includes('/buyer/b2b-request') ||
    pathname.includes('/buyer/search') ||
    pathname.includes('/product') ||
    pathname.includes('/capture');

  if (isLoading || !role) {
    return (
      <View className="flex-1 items-center justify-center bg-artisan-canvas">
        <ActivityIndicator size="large" color="#C85A32" />
      </View>
    );
  }

  const commonScreenOptions = {
    headerShown: false,
    freezeOnBlur: false,
    detachInactiveScreens: false,
    tabBarActiveTintColor: '#C85A32',
    tabBarInactiveTintColor: '#8C7E72',
    tabBarHideOnKeyboard: true,
    tabBarStyle: isSubRoute
      ? { display: 'none' as const }
      : {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2DCD5',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 6,
          shadowColor: '#1E293B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
    tabBarLabelStyle: {
      fontSize: 10.5,
      fontWeight: '700' as const,
    },
  };

  // ─── BUYER TAB NAVIGATOR ───
  if (isBuyer) {
    return (
      <Tabs initialRouteName="buyer" screenOptions={commonScreenOptions}>
        {/* Buyer Tab 1: Explore / बाज़ार */}
        <Tabs.Screen
          name="buyer"
          options={{
            title: 'Explore / बाज़ार',
            tabBarIcon: ({ color, focused }) => (
              <Store
                color={color}
                size={focused ? 23 : 21}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />

        {/* Buyer Tab 2: Cart / कार्ट */}
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart / कार्ट',
            tabBarIcon: ({ color, focused }) => (
              <View className="relative">
                <ShoppingCart
                  color={color}
                  size={focused ? 23 : 21}
                  strokeWidth={focused ? 2.5 : 2}
                />
                {cartCount > 0 ? (
                  <View className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-artisan-primary items-center justify-center">
                    <Text className="text-[9px] font-black text-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            ),
          }}
        />

        {/* Buyer Tab 3: Orders / मेरे ऑर्डर */}
        <Tabs.Screen
          name="buyer-orders"
          options={{
            title: 'Orders / ऑर्डर',
            tabBarIcon: ({ color, focused }) => (
              <Package
                color={color}
                size={focused ? 23 : 21}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />

        {/* Shared Tab: Profile / प्रोफ़ाइल */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile / प्रोफ़ाइल',
            tabBarIcon: ({ color, focused }) => (
              <User
                color={color}
                size={focused ? 23 : 21}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />

        {/* Hidden Seller Routes from Buyer view */}
        <Tabs.Screen name="dashboard" options={{ href: null }} />
        <Tabs.Screen name="catalog" options={{ href: null }} />
        <Tabs.Screen name="orders" options={{ href: null }} />
        <Tabs.Screen name="capture" options={{ href: null }} />
        <Tabs.Screen name="product" options={{ href: null }} />
      </Tabs>
    );
  }

  // ─── ARTISAN / SELLER TAB NAVIGATOR ───
  return (
    <Tabs initialRouteName="dashboard" screenOptions={commonScreenOptions}>
      {/* Seller Tab 1: Home / मुख्य */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home / मुख्य',
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Seller Tab 2: Catalog / कैटलॉग */}
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog / कैटलॉग',
          tabBarIcon: ({ color, focused }) => (
            <Package
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Seller Tab 3: Orders / ऑर्डर */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders / ऑर्डर',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Shared Tab: Profile / प्रोफ़ाइल */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile / प्रोफ़ाइल',
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Hidden Buyer Routes from Seller view */}
      <Tabs.Screen name="buyer" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="buyer-orders" options={{ href: null }} />
      <Tabs.Screen name="capture" options={{ href: null }} />
      <Tabs.Screen name="product" options={{ href: null }} />
    </Tabs>
  );
}
