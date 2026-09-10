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
import { User, Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('कृपया सभी विवरण भरें (Please fill all fields)');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password must be at least 6 characters)');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            onboarded: false,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.session) {
        // Auto signed in: navigate to onboarding for role selection & details
        router.replace('/(auth)/onboarding');
      } else {
        setSuccessMessage(
          'खाता बनाया गया! (Account created! Please sign in to select your role and complete setup.)',
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
        {/* Header Branding */}
        <View className="mb-8 items-center">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-3xl bg-artisan-amber shadow-lg shadow-artisan-amber/30">
            <UserPlus color="#FFFFFF" size={40} />
          </View>
          <Text className="text-3xl font-extrabold tracking-tight text-artisan-slate">
            Join KalaSangam
          </Text>
          <Text className="mt-1 text-lg font-medium text-artisan-primary">
            कारीगर पंजीकरण • Artisan Registration
          </Text>
          <Text className="mt-2 text-center text-base text-artisan-muted">
            Create your artisan profile to showcase crafts
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

        {/* Success Alert Banner */}
        {successMessage && (
          <View className="mb-6 rounded-2xl border border-artisan-success/30 bg-green-50 p-4 flex-row items-center">
            <CheckCircle color="#16A34A" size={24} />
            <Text className="ml-3 flex-1 text-base font-semibold text-artisan-success">
              {successMessage}
            </Text>
          </View>
        )}

        {/* Input Fields */}
        <View className="space-y-4">
          {/* Full Name */}
          <View>
            <Text className="mb-2 text-base font-bold text-artisan-slate">
              Your Name / आपका नाम
            </Text>
            <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
              <User color="#E58A13" size={24} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Sunita Devi"
                placeholderTextColor="#94A3B8"
                className="ml-3 flex-1 text-lg font-medium text-artisan-slate"
              />
            </View>
          </View>

          {/* Email */}
          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-artisan-slate">
              Email / ईमेल
            </Text>
            <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
              <Mail color="#E58A13" size={24} />
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

          {/* Password */}
          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-artisan-slate">
              Password / पासवर्ड (Min. 6 chars)
            </Text>
            <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
              <Lock color="#E58A13" size={24} />
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

          {/* Register Submit Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-6 h-16 flex-row items-center justify-center rounded-2xl bg-artisan-amber shadow-lg shadow-artisan-amber/30"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <UserPlus color="#FFFFFF" size={24} />
                <Text className="ml-3 text-xl font-bold text-white">
                  Create Account / खाता बनाएं
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation to Login */}
        <View className="mt-8 items-center">
          <Text className="text-base text-artisan-muted">
            Already registered? / पहले से खाता है?
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-2 py-3 px-6 rounded-xl border border-artisan-slate/20 bg-white"
          >
            <Text className="text-lg font-bold text-artisan-slate">
              Sign In Here / यहाँ लॉगिन करें
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
