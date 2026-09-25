import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  ArrowRight,
  Crop,
  Star,
  Trash2,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import { useDraftStore, MAX_PHOTOS } from '../../../src/store/useDraftStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Text, Button, ScreenHeader, StepBar, COLORS } from '../../../src/components/ui';
import { useT, type TranslationKey } from '../../../src/i18n';
import { ImageCropper } from '../../../src/components/ImageCropper';

/** Suggested shot for each slot — only a hint, any photo can go anywhere */
const SHOT_LABELS: TranslationKey[] = [
  'capture.shotFront',
  'capture.shotSide',
  'capture.shotClose',
  'capture.shotUse',
  'capture.shotYou',
];

type Photo = { uri: string; original: string };
/** A photo waiting in the crop screen: new (index null) or replacing a slot */
type CropJob = { source: string; index: number | null };

export default function CaptureImageScreen() {
  const router = useRouter();
  const { t } = useT();
  const { width: screenWidth } = useWindowDimensions();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  const { imageUris, setImageUris } = useDraftStore();
  // Keep the uncropped photo too, so "Crop again" starts from the whole picture
  const [photos, setPhotos] = useState<Photo[]>(() =>
    imageUris.map((uri) => ({ uri, original: uri })),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cropJob, setCropJob] = useState<CropJob | null>(null);
  const [cropQueue, setCropQueue] = useState<string[]>([]);

  const remaining = MAX_PHOTOS - photos.length;
  const selected = photos[selectedIndex] ?? photos[0] ?? null;

  const savePhotos = (next: Photo[]) => {
    setPhotos(next);
    setImageUris(next.map((p) => p.uri));
  };

  const takePhoto = async () => {
    if (remaining <= 0) {
      Alert.alert(t('capture.maxPhotos'));
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('capture.cameraPermTitle'), t('capture.cameraPermMsg'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]) {
        setCropJob({ source: result.assets[0].uri, index: null });
      }
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert(t('capture.cameraFailed'), t('capture.useGallery'));
    }
  };

  const pickFromGallery = async () => {
    if (remaining <= 0) {
      Alert.alert(t('capture.maxPhotos'));
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('capture.galleryPermTitle'), t('capture.galleryPermMsg'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: remaining > 1,
        selectionLimit: remaining,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        // Crop them one after another
        const [first, ...rest] = result.assets.slice(0, remaining).map((a) => a.uri);
        setCropQueue(rest);
        setCropJob({ source: first, index: null });
      }
    } catch (error) {
      console.error('Error launching gallery:', error);
    }
  };

  // Move on to the next picked photo, if any (and if there is still room)
  const nextInQueue = (photoCount: number) => {
    if (cropQueue.length > 0 && photoCount < MAX_PHOTOS) {
      const [next, ...rest] = cropQueue;
      setCropQueue(rest);
      setCropJob({ source: next, index: null });
    } else {
      setCropQueue([]);
      setCropJob(null);
    }
  };

  const handleCropDone = (uri: string) => {
    if (!cropJob) return;
    let next: Photo[];
    if (cropJob.index === null) {
      next = [...photos, { uri, original: cropJob.source }].slice(0, MAX_PHOTOS);
      setSelectedIndex(next.length - 1);
    } else {
      next = photos.map((p, i) => (i === cropJob.index ? { uri, original: cropJob.source } : p));
      setSelectedIndex(cropJob.index);
    }
    savePhotos(next);
    nextInQueue(next.length);
  };

  const handleCropCancel = () => nextInQueue(photos.length);

  const removeSelected = () => {
    const next = photos.filter((_, i) => i !== selectedIndex);
    savePhotos(next);
    setSelectedIndex(Math.max(0, Math.min(selectedIndex, next.length - 1)));
  };

  const makeSelectedMain = () => {
    if (selectedIndex === 0 || !selected) return;
    savePhotos([selected, ...photos.filter((_, i) => i !== selectedIndex)]);
    setSelectedIndex(0);
  };

  const handleNext = () => {
    if (photos.length === 0) {
      Alert.alert(t('capture.photoFirstTitle'), t('capture.photoFirstMsg'));
      return;
    }
    setImageUris(photos.map((p) => p.uri));
    router.push('/(app)/capture/voice');
  };

  // 3 slots per row
  const slotSize = Math.floor((Math.min(screenWidth, 480) - 32 - 2 * 10) / 3);

  return (
    <View className="flex-1 bg-artisan-canvas">
      <ScreenHeader title={t('capture.takePhoto')} onBack={() => router.back()} />
      <StepBar step={1} labels={[t('capture.stepPhoto'), t('capture.stepVoice'), t('capture.stepCheck')]} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Big preview of the chosen photo */}
        {selected ? (
          <View key="preview" className="mb-3 overflow-hidden rounded-2xl border-2 border-artisan-border bg-stone-100">
            <Image source={{ uri: selected.uri }} style={{ width: '100%', height: 300 }} resizeMode="contain" />
            {selectedIndex === 0 ? (
              <View
                className="absolute left-3 top-3 flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Star color="#FFFFFF" size={16} fill="#FFFFFF" />
                <Text className="ml-1.5 text-sm font-bold" style={{ color: '#FFFFFF' }}>
                  {t('capture.mainPhoto')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            key="placeholder"
            onPress={takePhoto}
            activeOpacity={0.85}
            className="mb-5 h-72 items-center justify-center rounded-2xl border-2 border-dashed border-artisan-primary bg-white"
          >
            <View className="h-28 w-28 items-center justify-center rounded-full bg-artisan-light">
              <Camera color={COLORS.primary} size={60} />
            </View>
            <Text className="mt-4 text-center text-xl font-bold text-artisan-slate">
              {t('capture.takeItemPhoto')}
            </Text>
            <Text className="text-center text-base text-artisan-muted">{t('capture.goodLight')}</Text>
          </TouchableOpacity>
        )}

        {/* Actions for the chosen photo */}
        {selected ? (
          <View key="photo-actions" className="mb-5 flex-row" style={{ gap: 8 }}>
            <PhotoAction
              icon={Crop}
              label={t('capture.cropAgain')}
              onPress={() => setCropJob({ source: selected.original, index: selectedIndex })}
            />
            {selectedIndex > 0 ? (
              <PhotoAction key="make-main" icon={Star} label={t('capture.makeMain')} onPress={makeSelectedMain} />
            ) : null}
            <PhotoAction icon={Trash2} label={t('capture.remove')} onPress={removeSelected} danger />
          </View>
        ) : null}

        {/* 5 photo slots */}
        {photos.length > 0 ? (
          <View key="slots" className="mb-5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-artisan-slate">
                {t('capture.photosCount', { n: photos.length })}
              </Text>
            </View>
            {remaining > 0 ? (
              <Text className="mb-3 text-base text-artisan-muted">{t('capture.addMoreHint')}</Text>
            ) : null}
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
                const photo = photos[i];
                if (photo) {
                  const isSelected = i === selectedIndex;
                  return (
                    <TouchableOpacity
                      key={`slot-photo-${i}`}
                      onPress={() => setSelectedIndex(i)}
                      activeOpacity={0.85}
                      accessibilityLabel={t('capture.photoN', { n: i + 1 })}
                      className="overflow-hidden rounded-xl"
                      style={{
                        width: slotSize,
                        height: slotSize,
                        borderWidth: 3,
                        borderColor: isSelected ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View
                        className="absolute left-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full"
                        style={{ backgroundColor: i === 0 ? COLORS.primary : 'rgba(0,0,0,0.6)' }}
                      >
                        {i === 0 ? (
                          <Star color="#FFFFFF" size={14} fill="#FFFFFF" />
                        ) : (
                          <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                            {i + 1}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }
                const isNext = i === photos.length;
                return (
                  <TouchableOpacity
                    key={`slot-empty-${i}`}
                    onPress={takePhoto}
                    activeOpacity={0.85}
                    className="items-center justify-center rounded-xl bg-white"
                    style={{
                      width: slotSize,
                      height: slotSize,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: isNext ? COLORS.primary : COLORS.border,
                    }}
                  >
                    {isNext ? (
                      <Plus color={COLORS.primary} size={28} />
                    ) : (
                      <Camera color={COLORS.muted} size={24} />
                    )}
                    <Text
                      className="mt-1 px-1 text-center text-sm font-semibold"
                      style={{ color: isNext ? COLORS.primary : COLORS.muted }}
                      numberOfLines={1}
                    >
                      {t(SHOT_LABELS[i])}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {photos.length === 0 ? (
          <View key="image-actions-capture" style={{ gap: 12 }}>
            <Button key="btn-take-photo" label={t('capture.takePhoto')} icon={Camera} onPress={takePhoto} />
            <Button
              key="btn-pick-gallery"
              label={t('capture.fromGallery')}
              icon={ImageIcon}
              variant="secondary"
              onPress={pickFromGallery}
            />
          </View>
        ) : (
          <View key="image-actions-preview" style={{ gap: 12 }}>
            <Button key="btn-next-voice" label={t('common.next')} icon={ArrowRight} onPress={handleNext} />
            {remaining > 0 ? (
              <View key="add-more" className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Button
                    label={t('capture.takePhoto')}
                    icon={Camera}
                    variant="secondary"
                    compact
                    onPress={takePhoto}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={t('capture.fromGallery')}
                    icon={ImageIcon}
                    variant="secondary"
                    compact
                    onPress={pickFromGallery}
                  />
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!cropJob}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleCropCancel}
      >
        {cropJob ? (
          <ImageCropper
            key={`${cropJob.source}-${cropJob.index ?? 'new'}`}
            uri={cropJob.source}
            onCancel={handleCropCancel}
            onDone={handleCropDone}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function PhotoAction({
  icon: Icon,
  label,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? COLORS.error : COLORS.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      className="h-12 flex-1 flex-row items-center justify-center rounded-xl bg-white px-2"
      style={{ borderWidth: 2, borderColor: danger ? '#FECACA' : COLORS.border }}
    >
      <Icon color={color} size={18} />
      <Text className="ml-1.5 text-base font-bold" style={{ color }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
