import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle, LogIn } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { Text, IconInput, Button, Field, LanguagePicker, COLORS } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { useLanguageStore } from '../../src/store/useLanguageStore';

export default function RegisterScreen() {
    const router = useRouter();
  const { t, language } = useT();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage(t('auth.fillAll'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.passwordShort'));
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
            language,
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
                    t('auth.accountCreated'),
        );
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
        <View className="mb-8 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-artisan-primary">
            <UserPlus color="#FFFFFF" size={40} />
          </View>
          <Text className="mt-4 text-3xl font-bold text-artisan-slate">{t('auth.newAccount')}</Text>
        </View>

        {/* Language choice — the whole app switches immediately */}
        <View className="mb-6">
          <Text className="mb-2 text-lg font-bold text-artisan-slate">{t('lang.choose')}</Text>
          <LanguagePicker value={language} onChange={setLanguage} />
        </View>

        {errorMessage ? (
          <View className="mb-5 rounded-xl border-2 border-artisan-error bg-red-50 p-4">
            <Text className="text-center text-base font-semibold text-artisan-error">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="mb-5 flex-row items-center rounded-xl border-2 border-artisan-success bg-green-50 p-4">
            <CheckCircle color={COLORS.success} size={26} />
            <Text className="ml-3 flex-1 text-base font-semibold text-artisan-success">
              {t('auth.accountCreated')}
            </Text>
          </View>
        ) : null}

        <Field label={t('auth.yourName')}>
          <IconInput
            icon={User}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('auth.namePlaceholder')}
          />
        </Field>

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

        <Field label={t('auth.password')} hint={t('auth.passwordHint')}>
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
          label={t('auth.createAccount')}
          icon={UserPlus}
          onPress={handleRegister}
          loading={loading}
          className="mt-2"
        />

        <View className="my-6 flex-row items-center">
          <View className="h-px flex-1 bg-artisan-border" />
          <Text className="mx-3 text-base text-artisan-muted">{t('auth.haveAccount')}</Text>
          <View className="h-px flex-1 bg-artisan-border" />
        </View>

        <Button
          label={t('auth.login')}
          icon={LogIn}
          variant="secondary"
          onPress={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
