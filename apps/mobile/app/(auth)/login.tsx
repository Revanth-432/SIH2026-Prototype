import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('कृपया ईमेल और पासवर्ड दर्ज करें (Please enter email & password)');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.session) {
        const user = data.user;
        const onboarded = !!user?.user_metadata?.onboarded;
        const role = user?.user_metadata?.role;

        if (!onboarded || !role) {
          router.replace('/(auth)/onboarding');
        } else if (role === 'BUYER' || role === 'B2B_BUYER') {
          router.replace('/(app)/buyer/feed');
        } else {
          router.replace('/(app)/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-artisan-canvas"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Branding (Low Literacy Friendly) */}
        <View className="mb-8 items-center">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-3xl bg-artisan-primary shadow-lg shadow-artisan-primary/30">
            <Sparkles color="#FFFFFF" size={40} />
          </View>
          <Text className="text-3xl font-extrabold tracking-tight text-artisan-slate">
            KalaSangam
          </Text>
          <Text className="mt-1 text-lg font-medium text-artisan-primary">
            कला संगम • Artisan Studio
          </Text>
          <Text className="mt-2 text-center text-base text-artisan-muted">
            Sign In to your artisan account
          </Text>
        </View>

        {/* Error Alert Banner */}
        {errorMessage && (
          <View className="mb-6 rounded-2xl border border-artisan-error/30 bg-red-50 p-4">
            <Text className="text-center text-base font-semibold text-artisan-error">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Input Form with Large Touch Targets */}
        <View className="space-y-4">
          {/* Email / Phone Field */}
          <View>
            <Text className="mb-2 text-base font-bold text-artisan-slate">
              Email / ईमेल
            </Text>
            <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
              <Mail color="#C85A32" size={24} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="artisan@example.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                className="ml-3 flex-1 text-lg font-medium text-artisan-slate"
              />
            </View>
          </View>

          {/* Password Field */}
          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-artisan-slate">
              Password / पासवर्ड
            </Text>
            <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
              <Lock color="#C85A32" size={24} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="ml-3 flex-1 text-lg font-medium text-artisan-slate"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="p-2"
                accessibilityLabel="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff color="#64748B" size={22} />
                ) : (
                  <Eye color="#64748B" size={22} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Action Button (Extra Large Touch Target: Height 60px) */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-6 h-16 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-lg shadow-artisan-primary/30"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <LogIn color="#FFFFFF" size={24} />
                <Text className="ml-3 text-xl font-bold text-white">
                  Sign In / प्रवेश करें
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation to Registration */}
        <View className="mt-8 items-center">
          <Text className="text-base text-artisan-muted">
            New to KalaSangam? / नया खाता बनाएं?
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="mt-2 py-3 px-6 rounded-xl border border-artisan-primary/20 bg-artisan-light"
          >
            <Text className="text-lg font-bold text-artisan-primary">
              Register Here / यहाँ रजिस्टर करें
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
