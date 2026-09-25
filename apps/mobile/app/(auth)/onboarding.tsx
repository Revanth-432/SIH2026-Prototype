import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ShoppingBag,
  Palette,
  User,
  Phone,
  MapPin,
  Compass,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { getApiBaseUrl } from '../../src/lib/api';
import { Text, IconInput, Button, Field, COLORS } from '../../src/components/ui';
import { useT } from '../../src/i18n';

type UserRoleOption = 'ARTISAN' | 'BUYER';

interface OnboardingFormData {
  fullName: string;
  phone: string;
  region: string;
  state: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, language } = useT();
  const insets = useSafeAreaInsets();
  const { session, user, setRole, setOnboarded } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRoleOption>('ARTISAN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      fullName:
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        '',
      phone: user?.phone || '',
      region: '',
      state: '',
    },
  });

  const handleRoleSelect = (role: UserRoleOption) => {
    setSelectedRole(role);
    setStep(2);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // 1. Ensure access token
      let accessToken = session?.access_token;
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData.session?.access_token;
      }

      if (!accessToken) {
        Alert.alert(
                    t('onb.sessionTitle'),
          t('onb.sessionMsg'),
        );
        router.replace('/(auth)/login');
        return;
      }

      // 2. Prepare payload for backend profile endpoint
      const payload: Record<string, any> = {
        fullName: data.fullName.trim(),
        region: data.region.trim(),
        state: data.state.trim(),
        role: selectedRole,
        preferredLanguage: language,
        craftType:
          selectedRole === 'ARTISAN' ? 'Traditional Handicrafts' : 'Artisan Buyer',
      };
      if (data.phone && data.phone.trim()) {
        payload.phone = data.phone.trim();
      }

      const baseApi = getApiBaseUrl();
      const endpoint = `${baseApi}/users/profile`;

      console.log(`Submitting profile to: ${endpoint}`);

      // 3. Post to backend API
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        // 409 Conflict means profile already exists; proceed smoothly
        if (!res.ok && res.status !== 409) {
          const resJson = await res.json().catch(() => null);
          console.warn('Backend profile creation notice:', resJson);
        }
      } catch (apiErr: any) {
        console.warn('Backend profile API request non-fatal error:', apiErr);
      }

      // 4. Update Supabase Auth metadata for seamless persistent role
      try {
        await supabase.auth.updateUser({
          data: {
            role: selectedRole,
            full_name: data.fullName.trim(),
                        onboarded: true,
            language,
          },
        });
      } catch (sbErr) {
        console.warn('Could not update Supabase user metadata:', sbErr);
      }

      // 5. Update global Zustand auth store
      setRole(selectedRole);
      setOnboarded(true);

      // 6. Navigate to corresponding dashboard
      if (selectedRole === 'BUYER') {
        router.replace('/(app)/buyer/feed');
      } else {
        router.replace('/(app)/dashboard');
      }
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setErrorMessage(err.message || t('common.somethingWrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6 items-center">
            <Text className="text-3xl font-bold text-artisan-slate text-center">
              {step === 1 ? t('onb.whoAreYou') : t('onb.yourDetails')}
            </Text>
          </View>

          {errorMessage ? (
            <View className="mb-5 rounded-xl border-2 border-artisan-error bg-red-50 p-4">
              <Text className="text-center text-base font-semibold text-artisan-error">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {step === 1 ? (
            <View key="step-role-selection" className="w-full">
              <TouchableOpacity
                key="btn-role-artisan"
                onPress={() => handleRoleSelect('ARTISAN')}
                activeOpacity={0.85}
                className="mb-4 flex-row items-center rounded-2xl border-2 border-artisan-primary bg-white p-5"
              >
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-artisan-light">
                  <Palette color={COLORS.primary} size={44} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-2xl font-bold text-artisan-slate">{t('onb.iMake')}</Text>
                  <Text className="text-base text-artisan-muted">{t('onb.iMakeSub')}</Text>
                </View>
                <ChevronRight color={COLORS.primary} size={32} />
              </TouchableOpacity>

              <TouchableOpacity
                key="btn-role-buyer"
                onPress={() => handleRoleSelect('BUYER')}
                activeOpacity={0.85}
                className="flex-row items-center rounded-2xl border-2 border-artisan-border bg-white p-5"
              >
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-stone-100">
                  <ShoppingBag color={COLORS.ink} size={44} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-2xl font-bold text-artisan-slate">{t('onb.iBuy')}</Text>
                  <Text className="text-base text-artisan-muted">{t('onb.iBuySub')}</Text>
                </View>
                <ChevronRight color={COLORS.ink} size={32} />
              </TouchableOpacity>
            </View>
          ) : (
            <View key="step-basic-details" className="w-full">
              {/* Chosen role + change */}
              <View className="mb-5 flex-row items-center rounded-2xl border border-artisan-border bg-white p-3">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-artisan-light">
                  {selectedRole === 'ARTISAN' ? (
                    <Palette color={COLORS.primary} size={26} />
                  ) : (
                    <ShoppingBag color={COLORS.ink} size={26} />
                  )}
                </View>
                <Text className="ml-3 flex-1 text-lg font-bold text-artisan-slate">
                  {selectedRole === 'ARTISAN' ? t('onb.artisan') : t('onb.buyer')}
                </Text>
                <TouchableOpacity
                  key="btn-change-role"
                  onPress={() => setStep(1)}
                  className="h-12 flex-row items-center rounded-xl bg-stone-100 px-3"
                >
                  <RotateCcw color={COLORS.muted} size={18} />
                  <Text className="ml-1.5 text-base font-bold text-artisan-slate">{t('onb.change')}</Text>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="fullName"
                rules={{ required: t('onb.errName') }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field label={t('onb.fullName')} error={errors.fullName?.message}>
                    <IconInput
                      icon={User}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('auth.namePlaceholder')}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="phone"
                rules={{ required: t('onb.errPhone') }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field label={t('onb.phone')} error={errors.phone?.message}>
                    <IconInput
                      icon={Phone}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="98765 43210"
                      keyboardType="phone-pad"
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="region"
                rules={{ required: t('onb.errDistrict') }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field label={t('onb.district')} error={errors.region?.message}>
                    <IconInput
                      icon={MapPin}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('onb.districtPh')}
                    />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="state"
                rules={{ required: t('onb.errState') }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field label={t('onb.state')} error={errors.state?.message}>
                    <IconInput
                      icon={Compass}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('onb.statePh')}
                    />
                  </Field>
                )}
              />

              <Button
                label={t('onb.start')}
                icon={CheckCircle2}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                className="mt-2"
              />

              <Button
                label={t('common.goBack')}
                icon={ArrowLeft}
                variant="ghost"
                compact
                onPress={() => setStep(1)}
                className="mt-2"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
