import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  LogOut,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Languages,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileText,
  Award,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, role, signOut, isLoading } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const artisanName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Kala Artisan';

  const artisanPhone =
    user?.phone || user?.user_metadata?.phone || '+91 98765 43210';

  const handleSignOut = () => {
    Alert.alert(
      'लॉग आउट (Sign Out)',
      'Are you sure you want to sign out from KalaSangam?',
      [
        { text: 'Cancel / रद्द करें', style: 'cancel' },
        {
          text: 'Sign Out / हाँ',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
    >
      {/* Top Header */}
      <View className="border-b border-artisan-border bg-white px-5 pt-2 pb-4">
        <Text className="text-2xl font-black text-artisan-slate">
          Profile • प्रोफ़ाइल
        </Text>
        <Text className="text-xs font-semibold text-artisan-muted mt-0.5">
          Artisan identity, credentials & account settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 110, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Identity Card */}
        <View className="rounded-3xl border border-artisan-border bg-white p-5 shadow-sm mb-5">
          <View className="flex-row items-center">
            {/* Avatar Circle */}
            <View className="relative">
              <View className="h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 border-2 border-artisan-primary">
                <Text className="text-3xl font-black text-artisan-primary">
                  {artisanName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
                <ShieldCheck color="#FFFFFF" size={12} />
              </View>
            </View>

            {/* Name & Credentials */}
            <View className="ml-4 flex-1">
              <Text className="text-xl font-extrabold text-artisan-slate">
                {artisanName}
              </Text>

              <View className="mt-1 flex-row items-center">
                <View className="rounded-md bg-green-50 px-2 py-0.5 border border-green-200">
                  <Text className="text-[10px] font-black text-green-700 uppercase">
                    {role || 'ARTISAN'} • 100% Verified
                  </Text>
                </View>
              </View>

              <View className="mt-2 flex-row items-center">
                <MapPin color="#C85A32" size={13} />
                <Text className="ml-1 text-xs font-medium text-slate-600">
                  Heritage Craft Cluster • India
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-200">
            <View className="items-center flex-1">
              <Text className="text-base font-black text-artisan-primary">100%</Text>
              <Text className="text-[10px] font-bold text-slate-500">Fair Wage</Text>
            </View>
            <View className="h-6 w-px bg-slate-200" />
            <View className="items-center flex-1">
              <Text className="text-base font-black text-artisan-slate">Direct</Text>
              <Text className="text-[10px] font-bold text-slate-500">Bank UPI</Text>
            </View>
            <View className="h-6 w-px bg-slate-200" />
            <View className="items-center flex-1">
              <Text className="text-base font-black text-emerald-700">4.9 ★</Text>
              <Text className="text-[10px] font-bold text-slate-500">Artisan Trust</Text>
            </View>
          </View>
        </View>

        {/* Contact Information Section */}
        <Text className="mb-2.5 text-xs font-bold uppercase tracking-wider text-artisan-muted">
          Contact & Identification / संपर्क
        </Text>
        <View className="rounded-2xl border border-artisan-border bg-white p-4 shadow-sm mb-5 space-y-3">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center">
              <Phone color="#C85A32" size={18} />
              <Text className="ml-3 text-xs font-bold text-slate-600">Phone</Text>
            </View>
            <Text className="text-xs font-mono font-bold text-artisan-slate">
              {artisanPhone}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Mail color="#C85A32" size={18} />
              <Text className="ml-3 text-xs font-bold text-slate-600">Email</Text>
            </View>
            <Text className="text-xs font-bold text-artisan-slate">
              {user?.email || 'artisan@kalasangam.in'}
            </Text>
          </View>
        </View>

        {/* Preferences Section */}
        <Text className="mb-2.5 text-xs font-bold uppercase tracking-wider text-artisan-muted">
          Preferences & Language / भाषा और प्राथमिकता
        </Text>
        <View className="rounded-2xl border border-artisan-border bg-white p-4 shadow-sm mb-5 space-y-3">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center">
              <Languages color="#D97706" size={18} />
              <View className="ml-3">
                <Text className="text-xs font-bold text-artisan-slate">Language / भाषा</Text>
                <Text className="text-[10px] text-artisan-muted">हिन्दी & English</Text>
              </View>
            </View>
            <View className="rounded-lg bg-orange-100 px-2 py-1">
              <Text className="text-xs font-bold text-artisan-primary">हिंदी (Hi)</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles color="#16A34A" size={18} />
              <View className="ml-3">
                <Text className="text-xs font-bold text-artisan-slate">Order SMS / सूचनाएँ</Text>
                <Text className="text-[10px] text-artisan-muted">Instant notification on order</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E2DCD5', true: '#C85A32' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Prominent Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isLoading}
          activeOpacity={0.88}
          className="h-14 flex-row items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 active:bg-red-100 mb-8"
        >
          <LogOut color="#DC2626" size={20} />
          <Text className="ml-2.5 text-base font-extrabold text-artisan-error">
            Sign Out / लॉग आउट
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
