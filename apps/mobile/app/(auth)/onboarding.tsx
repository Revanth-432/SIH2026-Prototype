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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import {
  Sparkles,
  ShoppingBag,
  Palette,
  User,
  Phone,
  MapPin,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { getApiBaseUrl } from '../../src/lib/api';

type UserRoleOption = 'ARTISAN' | 'BUYER';

interface OnboardingFormData {
  fullName: string;
  phone: string;
  region: string;
  state: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
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
          'सत्र समाप्त (Session Expired)',
          'Please sign in again to complete onboarding.',
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
        preferredLanguage: 'hi',
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
      setErrorMessage(err.message || 'Setup failed. Please try again.');
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
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Banner */}
          <View className="mb-6 items-center">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-3xl bg-artisan-primary shadow-lg shadow-artisan-primary/30">
              <Sparkles color="#FFFFFF" size={32} />
            </View>
            <Text className="text-2xl font-extrabold text-artisan-slate text-center">
              Welcome to KalaSangam
            </Text>
            <Text className="mt-1 text-base font-semibold text-artisan-primary text-center">
              कला संगम में आपका स्वागत है
            </Text>
            <Text className="mt-2 text-center text-sm text-artisan-muted">
              {step === 1
                ? 'Step 1 of 2: Select how you wish to use the platform'
                : 'Step 2 of 2: Enter your basic contact details'}
            </Text>
          </View>

          {errorMessage && (
            <View className="mb-6 rounded-2xl border border-artisan-error/30 bg-red-50 p-4">
              <Text className="text-center text-base font-semibold text-artisan-error">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* ============================================================= */}
          {/* STEP 1: ROLE SELECTION (Artisan vs Buyer)                      */}
          {/* ============================================================= */}
          {step === 1 ? (
            <View key="step-role-selection" className="w-full space-y-6">
              <Text className="text-center text-lg font-bold text-artisan-slate mb-2">
                Who are you? / आप कौन हैं?
              </Text>

              {/* Option A: Artisan / Seller */}
              <TouchableOpacity
                key="btn-role-artisan"
                onPress={() => handleRoleSelect('ARTISAN')}
                activeOpacity={0.88}
                className="rounded-3xl border-3 border-artisan-primary bg-white p-6 shadow-md shadow-artisan-primary/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                    <Palette color="#C85A32" size={36} />
                  </View>
                  <View className="rounded-full bg-artisan-primary/15 px-4 py-1.5">
                    <Text className="text-xs font-bold text-artisan-primary uppercase">
                      Seller • विक्रेता
                    </Text>
                  </View>
                </View>

                <Text className="mt-4 text-2xl font-black text-artisan-slate">
                  I am an Artisan
                </Text>
                <Text className="text-lg font-bold text-artisan-amber">
                  मैं एक कारीगर / निर्माता हूँ
                </Text>

                <Text className="mt-2 text-base text-artisan-muted leading-relaxed">
                  Sell handcrafted creations, speak in your language to create AI catalogs, and receive direct customer and wholesale orders.
                </Text>

                <View className="mt-5 flex-row items-center justify-between border-t border-slate-100 pt-4">
                  <Text className="text-base font-extrabold text-artisan-primary">
                    Start as Artisan / कारीगर बनें
                  </Text>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-artisan-primary">
                    <ArrowRight color="#FFFFFF" size={20} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Option B: Buyer / Wholesale Customer */}
              <TouchableOpacity
                key="btn-role-buyer"
                onPress={() => handleRoleSelect('BUYER')}
                activeOpacity={0.88}
                className="mt-4 rounded-3xl border-3 border-slate-300 bg-white p-6 shadow-md shadow-slate-300/30"
              >
                <View className="flex-row items-center justify-between">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <ShoppingBag color="#1E293B" size={36} />
                  </View>
                  <View className="rounded-full bg-slate-200 px-4 py-1.5">
                    <Text className="text-xs font-bold text-slate-700 uppercase">
                      Buyer • खरीदार
                    </Text>
                  </View>
                </View>

                <Text className="mt-4 text-2xl font-black text-artisan-slate">
                  I am a Buyer
                </Text>
                <Text className="text-lg font-bold text-slate-600">
                  मैं एक खरीदार / व्यापारी हूँ
                </Text>

                <Text className="mt-2 text-base text-artisan-muted leading-relaxed">
                  Discover verified Indian handmade crafts, buy directly from artisans at fair wages, and submit bulk wholesale inquiries.
                </Text>

                <View className="mt-5 flex-row items-center justify-between border-t border-slate-100 pt-4">
                  <Text className="text-base font-extrabold text-slate-800">
                    Browse & Shop / सामान खरीदें
                  </Text>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                    <ArrowRight color="#FFFFFF" size={20} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* ============================================================= */
            /* STEP 2: BASIC DETAILS FORM                                    */
            /* ============================================================= */
            <View key="step-basic-details" className="w-full">
              {/* Role Selection Summary & Change Badge */}
              <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-artisan-border bg-white p-4 shadow-sm">
                <View className="flex-row items-center">
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-xl ${
                      selectedRole === 'ARTISAN' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}
                  >
                    {selectedRole === 'ARTISAN' ? (
                      <Palette color="#C85A32" size={24} />
                    ) : (
                      <ShoppingBag color="#1E293B" size={24} />
                    )}
                  </View>
                  <View className="ml-3">
                    <Text className="text-base font-black text-artisan-slate">
                      {selectedRole === 'ARTISAN'
                        ? 'Artisan Profile'
                        : 'Buyer Account'}
                    </Text>
                    <Text className="text-xs font-semibold text-artisan-amber">
                      {selectedRole === 'ARTISAN'
                        ? 'कारीगर खाता'
                        : 'खरीदार खाता'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  key="btn-change-role"
                  onPress={() => setStep(1)}
                  className="flex-row items-center rounded-xl bg-slate-100 px-3 py-2"
                >
                  <RotateCcw color="#64748B" size={16} />
                  <Text className="ml-1 text-sm font-bold text-slate-700">
                    Change / बदलें
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="mb-4 text-xl font-bold text-artisan-slate">
                Your Details / आपका विवरण
              </Text>

              {/* Full Name */}
              <View className="mb-4">
                <Text className="mb-1.5 text-base font-bold text-artisan-slate">
                  Full Name / पूरा नाम *
                </Text>
                <Controller
                  control={control}
                  name="fullName"
                  rules={{ required: 'Name is required / नाम आवश्यक है' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                      <User color="#C85A32" size={24} />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. Sunita Devi"
                        placeholderTextColor="#94A3B8"
                        className="ml-3 flex-1 text-lg font-semibold text-artisan-slate"
                      />
                    </View>
                  )}
                />
                {errors.fullName && (
                  <Text className="mt-1 text-sm font-semibold text-artisan-error">
                    {errors.fullName.message}
                  </Text>
                )}
              </View>

              {/* Phone Number */}
              <View className="mb-4">
                <Text className="mb-1.5 text-base font-bold text-artisan-slate">
                  Phone Number / फ़ोन नंबर *
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  rules={{ required: 'Phone is required / फ़ोन नंबर आवश्यक है' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                      <Phone color="#C85A32" size={24} />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        className="ml-3 flex-1 text-lg font-semibold text-artisan-slate"
                      />
                    </View>
                  )}
                />
                {errors.phone && (
                  <Text className="mt-1 text-sm font-semibold text-artisan-error">
                    {errors.phone.message}
                  </Text>
                )}
              </View>

              {/* Region / District */}
              <View className="mb-4">
                <Text className="mb-1.5 text-base font-bold text-artisan-slate">
                  Cluster / District / क्षेत्र या ज़िला *
                </Text>
                <Controller
                  control={control}
                  name="region"
                  rules={{ required: 'Region is required / क्षेत्र आवश्यक है' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                      <MapPin color="#C85A32" size={24} />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. Madhubani / Kutch / Jaipur"
                        placeholderTextColor="#94A3B8"
                        className="ml-3 flex-1 text-lg font-semibold text-artisan-slate"
                      />
                    </View>
                  )}
                />
                {errors.region && (
                  <Text className="mt-1 text-sm font-semibold text-artisan-error">
                    {errors.region.message}
                  </Text>
                )}
              </View>

              {/* State */}
              <View className="mb-6">
                <Text className="mb-1.5 text-base font-bold text-artisan-slate">
                  State / राज्य *
                </Text>
                <Controller
                  control={control}
                  name="state"
                  rules={{ required: 'State is required / राज्य आवश्यक है' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="h-16 flex-row items-center rounded-2xl border-2 border-artisan-border bg-white px-4">
                      <Compass color="#C85A32" size={24} />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. Bihar / Gujarat / Rajasthan"
                        placeholderTextColor="#94A3B8"
                        className="ml-3 flex-1 text-lg font-semibold text-artisan-slate"
                      />
                    </View>
                  )}
                />
                {errors.state && (
                  <Text className="mt-1 text-sm font-semibold text-artisan-error">
                    {errors.state.message}
                  </Text>
                )}
              </View>

              {/* Submit Complete Setup Button */}
              <TouchableOpacity
                key="btn-complete-setup"
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                activeOpacity={0.85}
                className="h-20 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-xl shadow-artisan-primary/30"
              >
                {isSubmitting ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="ml-3 text-xl font-bold text-white">
                      Saving Details...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <CheckCircle2 color="#FFFFFF" size={28} />
                    <Text className="ml-3 text-2xl font-black text-white">
                      Complete Setup / पूरा करें
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Back to Step 1 */}
              <TouchableOpacity
                key="btn-back-step1"
                onPress={() => setStep(1)}
                className="mt-4 h-14 flex-row items-center justify-center rounded-xl bg-white border border-artisan-border"
              >
                <ArrowLeft color="#64748B" size={20} />
                <Text className="ml-2 text-base font-bold text-artisan-muted">
                  Back to Role Selection / वापस जाएं
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
