import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react-native';
import { useDraftStore } from '../../../src/store/useDraftStore';
import { useAuthStore } from '../../../src/store/useAuthStore';

export default function CaptureImageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  const { imageUri, setImageUri } = useDraftStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(imageUri);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'कैमरा अनुमति आवश्यक है (Permission Required)',
          'Please allow camera access to photograph your craft.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setImageUri(uri);
      }
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert('Camera Error', 'Could not open camera. Please try gallery.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'गैलरी अनुमति आवश्यक है (Permission Required)',
          'Please allow media access to select your craft photo.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setImageUri(uri);
      }
    } catch (error) {
      console.error('Error launching gallery:', error);
    }
  };

  const handleNext = () => {
    if (!selectedImage) {
      Alert.alert(
        'कृपया फोटो लें (Photo Needed)',
        'Please capture or choose a photo of your craft before proceeding.',
      );
      return;
    }
    setImageUri(selectedImage);
    router.push('/(app)/capture/voice');
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-artisan-border bg-white px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xl font-bold text-artisan-slate">
            Step 1 of 3: Photo
          </Text>
          <Text className="text-xs font-semibold text-artisan-primary">
            कदम 1: उत्पाद की फोटो
          </Text>
        </View>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Photo Preview or Placeholder Box */}
        {selectedImage ? (
          <View className="relative mb-6 overflow-hidden rounded-3xl border-4 border-artisan-primary bg-white shadow-md">
            <Image
              source={{ uri: selectedImage }}
              style={{ width: '100%', height: 320 }}
              resizeMode="cover"
            />
            <View className="absolute bottom-3 right-3 rounded-full bg-artisan-primary/90 px-4 py-2">
              <Text className="text-sm font-bold text-white">
                ✓ Photo Ready / फोटो तैयार है
              </Text>
            </View>
          </View>
        ) : (
          <View className="mb-6 h-80 items-center justify-center rounded-3xl border-3 border-dashed border-artisan-border bg-white p-6 shadow-sm">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-3xl bg-artisan-light">
              <Camera color="#C85A32" size={48} />
            </View>
            <Text className="text-center text-2xl font-bold text-artisan-slate">
              Craft Photo / शिल्प फोटो
            </Text>
            <Text className="mt-2 text-center text-base text-artisan-muted">
              Tap the large button below to capture your handmade craft in good lighting.
            </Text>
          </View>
        )}

        {/* Action Buttons with High Touch Targets */}
        {!selectedImage ? (
          <View key="image-actions-capture" className="space-y-4">
            {/* Massive Primary Camera Button (Height 72px) */}
            <TouchableOpacity
              key="btn-take-photo"
              onPress={takePhoto}
              activeOpacity={0.85}
              className="h-20 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-lg shadow-artisan-primary/30"
            >
              <Camera color="#FFFFFF" size={32} />
              <Text className="ml-3 text-2xl font-extrabold text-white">
                Take Photo / फोटो लें
              </Text>
            </TouchableOpacity>

            {/* Gallery Secondary Button (Height 60px) */}
            <TouchableOpacity
              key="btn-pick-gallery"
              onPress={pickFromGallery}
              activeOpacity={0.85}
              className="mt-4 h-16 flex-row items-center justify-center rounded-2xl border-2 border-artisan-slate/20 bg-white"
            >
              <ImageIcon color="#1E293B" size={26} />
              <Text className="ml-3 text-lg font-bold text-artisan-slate">
                Select from Gallery / गैलरी से चुनें
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View key="image-actions-preview" className="space-y-4">
            {/* Next Step Button (Height 72px) */}
            <TouchableOpacity
              key="btn-next-voice"
              onPress={handleNext}
              activeOpacity={0.85}
              className="h-20 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-lg shadow-artisan-primary/30"
            >
              <Text className="mr-3 text-2xl font-extrabold text-white">
                Next: Voice Note / आगे बढ़ें
              </Text>
              <ArrowRight color="#FFFFFF" size={32} />
            </TouchableOpacity>

            {/* Retake Button */}
            <TouchableOpacity
              key="btn-retake-photo"
              onPress={takePhoto}
              activeOpacity={0.85}
              className="mt-4 h-16 flex-row items-center justify-center rounded-2xl border-2 border-artisan-border bg-white"
            >
              <RotateCcw color="#64748B" size={24} />
              <Text className="ml-3 text-lg font-bold text-artisan-slate">
                Retake Photo / दोबारा फोटो लें
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
