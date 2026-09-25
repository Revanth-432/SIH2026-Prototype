import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Share2 } from 'lucide-react-native';
import { Text, Button, ScreenHeader, COLORS } from './ui';
import { Logo } from './Logo';
import { useT } from '../i18n';

export type PosterDesign = 'simple' | 'festive' | 'status';

export interface PosterInfo {
  title: string;
  price: number | null;
  craftType?: string | null;
  artisanName?: string | null;
  /** e.g. "Pochampally, Telangana" */
  place?: string | null;
}

/** Saved poster width in pixels (Instagram / WhatsApp friendly) */
const EXPORT_WIDTH = 1080;

const GOLD = '#E8B04B';
const CREAM = '#FFF8F0';
const NIGHT = '#1C1917';

const DESIGNS: { key: PosterDesign; label: 'poster.simple' | 'poster.festive' | 'poster.status'; swatch: string[] }[] = [
  { key: 'simple', label: 'poster.simple', swatch: [CREAM, COLORS.primary] },
  { key: 'festive', label: 'poster.festive', swatch: [COLORS.primary, GOLD] },
  { key: 'status', label: 'poster.status', swatch: [NIGHT, GOLD] },
];

/** ₹12,34,567 — Indian digit grouping without relying on Intl */
export function formatRupees(value: number): string {
  const digits = Math.round(value).toString();
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `₹${rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},` : ''}${last3}`;
}

/**
 * Makes a shareable poster on the phone from the artisan's real photo.
 * Nothing is AI-generated, so the poster always shows the real item.
 */
export function PosterMaker({
  photos,
  info,
  onClose,
}: {
  photos: string[];
  info: PosterInfo;
  onClose: () => void;
}) {
  const { t } = useT();
  const { width: screenWidth } = useWindowDimensions();
  const posterRef = useRef<View>(null);

  const [design, setDesign] = useState<PosterDesign>('simple');
  const [photo, setPhoto] = useState(photos[0] ?? null);
  const [showPrice, setShowPrice] = useState(info.price != null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const width = Math.min(screenWidth - 32, 380);
  const height = Math.round(design === 'status' ? (width * 16) / 9 : width * 1.25);
  const u = width / 360; // scale unit so text sizes match the saved image

  const photoKey = `${design}|${photo}`;
  const isReady = !photo || loadedKey === photoKey;

  const content = {
    title: info.title,
    price: showPrice && info.price != null ? formatRupees(info.price) : null,
    subtitle: [info.craftType, info.place ? t('poster.from', { place: info.place }) : null]
      .filter(Boolean)
      .join(' · '),
    maker: info.artisanName ? t('poster.handmadeBy', { name: info.artisanName }) : null,
  };

  const photoEl = (style: object) =>
    photo ? (
      <Image
        key={photoKey}
        source={{ uri: photo }}
        style={style}
        resizeMode="contain"
        onLoad={() => setLoadedKey(photoKey)}
        onError={() => setLoadedKey(photoKey)}
      />
    ) : (
      <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
        <Logo size={64 * u} />
      </View>
    );

  const handleShare = async () => {
    if (!posterRef.current || !isReady) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(posterRef, {
        format: 'jpg',
        quality: 0.95,
        width: EXPORT_WIDTH,
        height: Math.round((EXPORT_WIDTH * height) / width),
        result: 'tmpfile',
      });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing not available');
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: t('poster.share'),
        UTI: 'public.jpeg',
      });
    } catch (err) {
      console.warn('Poster share failed:', err);
      Alert.alert(t('poster.shareFailed'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View className="flex-1 bg-artisan-canvas">
      <ScreenHeader title={t('product.makePoster')} subtitle={t('poster.hint')} onBack={onClose} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, alignItems: 'center' }}>
        {/* The poster — this exact view is saved as the image */}
        <View
          style={{
            borderRadius: 6,
            overflow: 'hidden',
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View ref={posterRef} collapsable={false} style={{ width, height }}>
            {design === 'simple' ? (
              <SimplePoster key="simple" u={u} width={width} height={height} content={content} photo={photoEl} t={t} />
            ) : design === 'festive' ? (
              <FestivePoster key="festive" u={u} width={width} height={height} content={content} photo={photoEl} t={t} />
            ) : (
              <StatusPoster key="status" u={u} width={width} height={height} content={content} photo={photoEl} t={t} />
            )}
          </View>
          {!isReady ? (
            <View
              key="poster-loading"
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.5)',
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : null}
        </View>

        <View style={{ width: '100%', maxWidth: 480, marginTop: 20 }}>
          {/* Design */}
          <Text className="mb-2 text-lg font-bold text-artisan-slate">{t('poster.design')}</Text>
          <View className="mb-5 flex-row" style={{ gap: 10 }}>
            {DESIGNS.map((d) => {
              const selected = d.key === design;
              return (
                <TouchableOpacity
                  key={d.key}
                  onPress={() => setDesign(d.key)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="flex-1 items-center rounded-2xl bg-white py-3"
                  style={{ borderWidth: 2, borderColor: selected ? COLORS.primary : COLORS.border }}
                >
                  <View className="flex-row overflow-hidden rounded-lg" style={{ width: 44, height: 28 }}>
                    <View style={{ flex: 1, backgroundColor: d.swatch[0] }} />
                    <View style={{ width: 14, backgroundColor: d.swatch[1] }} />
                  </View>
                  <Text
                    className="mt-1.5 text-base font-bold"
                    style={{ color: selected ? COLORS.primary : COLORS.ink }}
                    numberOfLines={1}
                  >
                    {t(d.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Photo */}
          {photos.length > 1 ? (
            <View key="photo-picker" className="mb-5">
              <Text className="mb-2 text-lg font-bold text-artisan-slate">{t('poster.photo')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {photos.map((p) => {
                  const selected = p === photo;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPhoto(p)}
                      activeOpacity={0.85}
                      className="overflow-hidden rounded-xl"
                      style={{
                        width: 72,
                        height: 72,
                        borderWidth: 3,
                        borderColor: selected ? COLORS.primary : 'transparent',
                      }}
                    >
                      <Image source={{ uri: p }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Price on/off */}
          {info.price != null ? (
            <View key="price-toggle" className="mb-5 flex-row items-center rounded-2xl border border-artisan-border bg-white p-4">
              <Text className="flex-1 text-lg font-semibold text-artisan-slate">{t('poster.showPrice')}</Text>
              <Switch
                value={showPrice}
                onValueChange={setShowPrice}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ) : null}

          <Button
            label={t('poster.share')}
            icon={Share2}
            variant="success"
            loading={isSharing}
            disabled={!isReady}
            onPress={handleShare}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Designs                                                            */
/* ------------------------------------------------------------------ */
type DesignProps = {
  u: number;
  width: number;
  height: number;
  content: { title: string; price: string | null; subtitle: string; maker: string | null };
  photo: (style: object) => React.ReactNode;
  t: ReturnType<typeof useT>['t'];
};

function Brand({ u, color }: { u: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Logo size={24 * u} />
      <Text className="font-bold" style={{ marginLeft: 6 * u, fontSize: 13 * u, color }}>
        Kala Vaani
      </Text>
    </View>
  );
}

/** Clean cream card — works for every craft */
function SimplePoster({ u, width, height, content, photo, t }: DesignProps) {
  const pad = 16 * u;
  return (
    <View style={{ flex: 1, backgroundColor: CREAM, padding: pad }}>
      <View
        style={{
          height: height * 0.6,
          borderRadius: 16 * u,
          overflow: 'hidden',
          backgroundColor: '#F1E8DC',
        }}
      >
        {photo({ width: width - pad * 2, height: height * 0.6 })}
        <View
          style={{
            position: 'absolute',
            left: 10 * u,
            top: 10 * u,
            backgroundColor: '#FFFFFF',
            borderRadius: 999,
            paddingHorizontal: 10 * u,
            paddingVertical: 4 * u,
          }}
        >
          <Text className="font-bold" style={{ fontSize: 12 * u, color: COLORS.primary }}>
            {t('poster.handmade')}
          </Text>
        </View>
      </View>

      <Text className="font-bold" numberOfLines={2} style={{ marginTop: 12 * u, fontSize: 22 * u, lineHeight: 28 * u, color: COLORS.ink }}>
        {content.title}
      </Text>
      {content.subtitle ? (
        <Text numberOfLines={1} style={{ marginTop: 2 * u, fontSize: 14 * u, color: COLORS.muted }}>
          {content.subtitle}
        </Text>
      ) : null}

      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 8 * u }}>
          {content.price ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: COLORS.primary,
                borderRadius: 12 * u,
                paddingHorizontal: 12 * u,
                paddingVertical: 4 * u,
              }}
            >
              <Text className="font-bold" style={{ fontSize: 22 * u, color: '#FFFFFF' }}>
                {content.price}
              </Text>
            </View>
          ) : null}
          {content.maker ? (
            <Text numberOfLines={1} style={{ marginTop: 6 * u, fontSize: 12 * u, color: COLORS.muted }}>
              {content.maker}
            </Text>
          ) : null}
        </View>
        <Brand u={u} color={COLORS.ink} />
      </View>
    </View>
  );
}

/** Terracotta + gold with a marigold toran — for festivals and melas */
function FestivePoster({ u, width, height, content, photo, t }: DesignProps) {
  const inset = 12 * u;
  const toranCount = 13;
  const photoW = width - 64 * u;
  const photoH = height * 0.5;
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center' }}>
      {/* Gold double border */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset,
          right: inset,
          top: inset,
          bottom: inset,
          borderWidth: 2 * u,
          borderColor: GOLD,
          borderRadius: 14 * u,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset + 5 * u,
          right: inset + 5 * u,
          top: inset + 5 * u,
          bottom: inset + 5 * u,
          borderWidth: 1,
          borderColor: 'rgba(232,176,75,0.6)',
          borderRadius: 10 * u,
        }}
      />

      {/* Marigold toran */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: width - 2 * (inset + 14 * u),
          marginTop: inset + 12 * u,
        }}
      >
        {Array.from({ length: toranCount }).map((_, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <View style={{ width: 1, height: (i % 2 === 0 ? 8 : 4) * u, backgroundColor: GOLD }} />
            <View
              style={{
                width: 12 * u,
                height: 12 * u,
                borderRadius: 6 * u,
                backgroundColor: i % 2 === 0 ? '#F59E0B' : '#FACC15',
              }}
            />
          </View>
        ))}
      </View>

      {/* Photo in a cream frame */}
      <View
        style={{
          marginTop: 12 * u,
          padding: 6 * u,
          backgroundColor: CREAM,
          borderRadius: 12 * u,
          borderWidth: 3 * u,
          borderColor: GOLD,
        }}
      >
        <View style={{ width: photoW - 18 * u, height: photoH, borderRadius: 8 * u, overflow: 'hidden', backgroundColor: '#F1E8DC' }}>
          {photo({ width: photoW - 18 * u, height: photoH })}
        </View>
      </View>

      <Text
        className="font-bold"
        numberOfLines={2}
        style={{ marginTop: 12 * u, paddingHorizontal: 32 * u, textAlign: 'center', fontSize: 22 * u, lineHeight: 28 * u, color: CREAM }}
      >
        {content.title}
      </Text>
      {content.subtitle ? (
        <Text numberOfLines={1} style={{ paddingHorizontal: 32 * u, textAlign: 'center', fontSize: 13 * u, color: '#FDE7C8' }}>
          {content.subtitle}
        </Text>
      ) : null}
      {content.price ? (
        <View
          style={{
            marginTop: 8 * u,
            backgroundColor: GOLD,
            borderRadius: 999,
            paddingHorizontal: 18 * u,
            paddingVertical: 3 * u,
          }}
        >
          <Text className="font-bold" style={{ fontSize: 22 * u, color: '#3B1D0E' }}>
            {content.price}
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />
      <View
        style={{
          width: width - 2 * (inset + 16 * u),
          marginBottom: inset + 12 * u,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: content.maker ? 'space-between' : 'center',
        }}
      >
        {content.maker ? (
          <Text numberOfLines={1} style={{ flex: 1, marginRight: 8 * u, fontSize: 12 * u, color: '#FDE7C8' }}>
            {content.maker}
          </Text>
        ) : null}
        <Brand u={u} color={CREAM} />
      </View>
    </View>
  );
}

/** Tall dark poster for WhatsApp Status / Instagram Stories */
function StatusPoster({ u, width, height, content, photo, t }: DesignProps) {
  const photoH = height * 0.58;
  const pad = 22 * u;
  return (
    <View style={{ flex: 1, backgroundColor: NIGHT }}>
      <View style={{ height: photoH, backgroundColor: '#292524' }}>
        {photo({ width, height: photoH })}
        <View
          style={{
            position: 'absolute',
            left: 14 * u,
            top: 14 * u,
            backgroundColor: GOLD,
            borderRadius: 999,
            paddingHorizontal: 12 * u,
            paddingVertical: 4 * u,
          }}
        >
          <Text className="font-bold" style={{ fontSize: 13 * u, color: '#3B1D0E' }}>
            {t('poster.handmade')}
          </Text>
        </View>
      </View>
      <View style={{ height: 4 * u, backgroundColor: COLORS.primary }} />

      <View style={{ flex: 1, padding: pad }}>
        <Text className="font-bold" numberOfLines={2} style={{ fontSize: 26 * u, lineHeight: 33 * u, color: CREAM }}>
          {content.title}
        </Text>
        {content.subtitle ? (
          <Text numberOfLines={1} style={{ marginTop: 4 * u, fontSize: 15 * u, color: '#D6D3D1' }}>
            {content.subtitle}
          </Text>
        ) : null}
        {content.price ? (
          <Text className="font-bold" style={{ marginTop: 10 * u, fontSize: 36 * u, color: GOLD }}>
            {content.price}
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: COLORS.primary,
            borderRadius: 14 * u,
            paddingHorizontal: 12 * u,
            paddingVertical: 8 * u,
          }}
        >
          <Logo size={26 * u} />
          <Text className="font-bold" style={{ marginLeft: 8 * u, fontSize: 16 * u, color: '#FFFFFF' }}>
            {t('poster.orderOn')}
          </Text>
        </View>
        {content.maker ? (
          <Text numberOfLines={1} style={{ marginTop: 10 * u, fontSize: 13 * u, color: '#A8A29E' }}>
            {content.maker}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
