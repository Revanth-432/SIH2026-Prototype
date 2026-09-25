import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { Text, IconInput, Button, Field, COLORS } from '../../src/components/ui';
import { Logo } from '../../src/components/Logo';
import { useT, type TranslateFn } from '../../src/i18n';

export default function LoginScreen() {
    const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage(t('auth.enterEmailPassword'));
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
      setErrorMessage(err.message || t('common.somethingWrong'));
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View className="mb-8 items-center">
          <Logo size={96} />
          <Text className="mt-4 text-3xl font-bold text-artisan-slate">{t('common.appName')}</Text>
        </View>

        {errorMessage ? (
          <View className="mb-5 rounded-xl border-2 border-artisan-error bg-red-50 p-4">
            <Text className="text-center text-base font-semibold text-artisan-error">
              {friendlyAuthError(errorMessage, t)}
            </Text>
          </View>
        ) : null}

        <Field label={t('auth.email')}>
          <IconInput
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder="aap@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Field>

        <Field label={t('auth.password')}>
          <IconInput
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            right={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="h-12 w-12 items-center justify-center"
                accessibilityLabel="Show or hide password"
              >
                {showPassword ? (
                  <EyeOff color={COLORS.muted} size={24} />
                ) : (
                  <Eye color={COLORS.muted} size={24} />
                )}
              </TouchableOpacity>
            }
          />
        </Field>

        <Button
          label={t('auth.login')}
          icon={LogIn}
          onPress={handleLogin}
          loading={loading}
          className="mt-2"
        />

        <View className="my-6 flex-row items-center">
          <View className="h-px flex-1 bg-artisan-border" />
          <Text className="mx-3 text-base text-artisan-muted">{t('auth.newHere')}</Text>
          <View className="h-px flex-1 bg-artisan-border" />
        </View>

        <Button
          label={t('auth.createAccount')}
          icon={UserPlus}
          variant="secondary"
          onPress={() => router.push('/(auth)/register')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyAuthError(message: string, t: TranslateFn): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return t('auth.wrongCredentials');
  }
  if (m.includes('email not confirmed')) {
    return t('auth.confirmEmail');
  }
  if (m.includes('network') || m.includes('fetch')) {
    return t('common.noInternet');
  }
  return message;
}
