import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  PanResponder,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  type LayoutChangeEvent,
  type PanResponderInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { RotateCw, Maximize, Check, X } from 'lucide-react-native';
import { Text, COLORS } from './ui';
import { useT } from '../i18n';

/** Largest side of the saved photo — keeps uploads and AI calls light */
const MAX_OUTPUT_SIDE = 1600;
/** Smallest crop box, in screen points */
const MIN_BOX = 70;
/** Touch area around each corner handle */
const HANDLE_HIT = 48;

type Rect = { x: number; y: number; w: number; h: number };
type Photo = { uri: string; width: number; height: number };
type Corner = 'tl' | 'tr' | 'bl' | 'br';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Full-screen crop step: drag the corners (or the whole box) over the item,
 * rotate if needed, then tap Done. Works the same on every phone, unlike the
 * system crop screen.
 */
export function ImageCropper({
  uri,
  onCancel,
  onDone,
}: {
  uri: string;
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(true);

  // Re-encode once so EXIF rotation is baked in: what is shown is exactly what gets cropped
  useEffect(() => {
    let alive = true;
    setBusy(true);
    manipulateAsync(uri, [], { compress: 0.95, format: SaveFormat.JPEG })
      .then((res) => alive && setPhoto({ uri: res.uri, width: res.width, height: res.height }))
      .catch(() => {
        if (!alive) return;
        Image.getSize(
          uri,
          (width, height) => setPhoto({ uri, width, height }),
          () => onDone(uri),
        );
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [uri]);

  // Where the photo sits inside the available area (contain-fit)
  const frame = useMemo(() => {
    if (!photo || !area) return null;
    const scale = Math.min(area.w / photo.width, area.h / photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    return { scale, w, h, left: (area.w - w) / 2, top: (area.h - h) / 2 };
  }, [photo, area]);

  const fullRect = (f: { w: number; h: number }): Rect => ({ x: 0, y: 0, w: f.w, h: f.h });

  // Start with a box slightly inside the photo edges so the handles are easy to grab
  useEffect(() => {
    if (!frame) return;
    const insetX = frame.w * 0.06;
    const insetY = frame.h * 0.06;
    setRect({ x: insetX, y: insetY, w: frame.w - insetX * 2, h: frame.h - insetY * 2 });
  }, [frame]);

  // Latest values for the gesture handlers
  const rectRef = useRef<Rect | null>(null);
  const frameRef = useRef(frame);
  rectRef.current = rect;
  frameRef.current = frame;
  const startRef = useRef<Rect | null>(null);

  const movePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = rectRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const s = startRef.current;
          const f = frameRef.current;
          if (!s || !f) return;
          setRect({
            ...s,
            x: clamp(s.x + g.dx, 0, f.w - s.w),
            y: clamp(s.y + g.dy, 0, f.h - s.h),
          });
        },
      }),
    [],
  );

  const cornerPans = useMemo(() => {
    const make = (corner: Corner): PanResponderInstance =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = rectRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const s = startRef.current;
          const f = frameRef.current;
          if (!s || !f) return;
          let left = s.x;
          let top = s.y;
          let right = s.x + s.w;
          let bottom = s.y + s.h;
          if (corner === 'tl' || corner === 'bl') left = clamp(s.x + g.dx, 0, right - MIN_BOX);
          if (corner === 'tr' || corner === 'br') right = clamp(s.x + s.w + g.dx, left + MIN_BOX, f.w);
          if (corner === 'tl' || corner === 'tr') top = clamp(s.y + g.dy, 0, bottom - MIN_BOX);
          if (corner === 'bl' || corner === 'br') bottom = clamp(s.y + s.h + g.dy, top + MIN_BOX, f.h);
          setRect({ x: left, y: top, w: right - left, h: bottom - top });
        },
      });
    return { tl: make('tl'), tr: make('tr'), bl: make('bl'), br: make('br') };
  }, []);

  const onAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ w: width, h: height });
  };

  const handleRotate = async () => {
    if (!photo || busy) return;
    setBusy(true);
    try {
      const res = await manipulateAsync(photo.uri, [{ rotate: 90 }], {
        compress: 0.95,
        format: SaveFormat.JPEG,
      });
      setPhoto({ uri: res.uri, width: res.width, height: res.height });
    } catch (err) {
      console.warn('Rotate failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDone = async () => {
    if (!photo || !frame || !rect || busy) return;
    setBusy(true);
    try {
      // Screen box → photo pixels
      const originX = Math.round(clamp(rect.x / frame.scale, 0, photo.width - 1));
      const originY = Math.round(clamp(rect.y / frame.scale, 0, photo.height - 1));
      const width = Math.round(clamp(rect.w / frame.scale, 1, photo.width - originX));
      const height = Math.round(clamp(rect.h / frame.scale, 1, photo.height - originY));

      const actions: Parameters<typeof manipulateAsync>[1] = [
        { crop: { originX, originY, width, height } },
      ];
      if (Math.max(width, height) > MAX_OUTPUT_SIDE) {
        actions.push({
          resize: width >= height ? { width: MAX_OUTPUT_SIDE } : { height: MAX_OUTPUT_SIDE },
        });
      }
      const res = await manipulateAsync(photo.uri, actions, {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      onDone(res.uri);
    } catch (err) {
      console.warn('Crop failed:', err);
      Alert.alert(t('capture.cropFailed'));
      onDone(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const handleSize = 26;
  const corners: { key: Corner; left: number; top: number }[] = rect
    ? [
        { key: 'tl', left: rect.x, top: rect.y },
        { key: 'tr', left: rect.x + rect.w, top: rect.y },
        { key: 'bl', left: rect.x, top: rect.y + rect.h },
        { key: 'br', left: rect.x + rect.w, top: rect.y + rect.h },
      ]
    : [];

  return (
    <View className="flex-1" style={{ backgroundColor: '#1C1917' }}>
      {/* Top bar */}
      <View
        className="flex-row items-center px-4 pb-3"
        style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
      >
        <TouchableOpacity
          onPress={onCancel}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('profile.cancel')}
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        >
          <X color="#FFFFFF" size={26} />
        </TouchableOpacity>
        <View className="ml-3 flex-1">
          <Text className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
            {t('capture.cropTitle')}
          </Text>
          <Text className="text-sm" style={{ color: '#D6D3D1' }}>
            {t('capture.cropHint')}
          </Text>
        </View>
      </View>

      {/* Photo + crop box */}
      <View className="flex-1" style={{ margin: 20 }} onLayout={onAreaLayout}>
        {photo && frame && rect ? (
          <View
            key="crop-stage"
            style={{
              position: 'absolute',
              left: frame.left,
              top: frame.top,
              width: frame.w,
              height: frame.h,
            }}
          >
            <Image
              source={{ uri: photo.uri }}
              style={{ width: frame.w, height: frame.h }}
              resizeMode="stretch"
            />

            {/* Dim everything outside the box */}
            <View pointerEvents="none" style={[shade, { left: 0, top: 0, width: frame.w, height: rect.y }]} />
            <View
              pointerEvents="none"
              style={[shade, { left: 0, top: rect.y + rect.h, width: frame.w, height: frame.h - rect.y - rect.h }]}
            />
            <View pointerEvents="none" style={[shade, { left: 0, top: rect.y, width: rect.x, height: rect.h }]} />
            <View
              pointerEvents="none"
              style={[shade, { left: rect.x + rect.w, top: rect.y, width: frame.w - rect.x - rect.w, height: rect.h }]}
            />

            {/* The box itself — drag to move */}
            <View
              {...movePan.panHandlers}
              style={{
                position: 'absolute',
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            >
              {/* Rule-of-thirds guides */}
              <View pointerEvents="none" style={[guide, { left: '33.3%', top: 0, bottom: 0, width: 1 }]} />
              <View pointerEvents="none" style={[guide, { left: '66.6%', top: 0, bottom: 0, width: 1 }]} />
              <View pointerEvents="none" style={[guide, { top: '33.3%', left: 0, right: 0, height: 1 }]} />
              <View pointerEvents="none" style={[guide, { top: '66.6%', left: 0, right: 0, height: 1 }]} />
            </View>

            {/* Corner handles — drag to resize */}
            {corners.map((c) => (
              <View
                key={c.key}
                {...cornerPans[c.key].panHandlers}
                style={{
                  position: 'absolute',
                  left: c.left - HANDLE_HIT / 2,
                  top: c.top - HANDLE_HIT / 2,
                  width: HANDLE_HIT,
                  height: HANDLE_HIT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: handleSize,
                    height: handleSize,
                    borderRadius: handleSize / 2,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 4,
                    borderColor: COLORS.primary,
                  }}
                />
              </View>
            ))}
          </View>
        ) : null}

        {busy ? (
          <View
            key="crop-busy"
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View
        className="flex-row px-4 pt-2"
        style={{ gap: 10, paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        <ToolButton icon={RotateCw} label={t('capture.rotate')} onPress={handleRotate} disabled={busy} />
        <ToolButton
          icon={Maximize}
          label={t('capture.fullPhoto')}
          onPress={() => frame && setRect(fullRect(frame))}
          disabled={busy}
        />
        <TouchableOpacity
          onPress={handleDone}
          disabled={busy || !rect}
          activeOpacity={0.85}
          accessibilityRole="button"
          className="h-16 flex-1 flex-row items-center justify-center rounded-2xl"
          style={{ backgroundColor: COLORS.primary, opacity: busy ? 0.6 : 1 }}
        >
          <Check color="#FFFFFF" size={24} />
          <Text className="ml-2 text-lg font-bold" style={{ color: '#FFFFFF' }}>
            {t('capture.cropDone')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onPress,
  disabled,
}: {
  icon: typeof RotateCw;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      className="h-16 items-center justify-center rounded-2xl px-3"
      style={{ backgroundColor: 'rgba(255,255,255,0.12)', minWidth: 84 }}
    >
      <Icon color="#FFFFFF" size={22} />
      <Text className="mt-0.5 text-sm font-semibold" style={{ color: '#FFFFFF' }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const shade = { position: 'absolute' as const, backgroundColor: 'rgba(0,0,0,0.6)' };
const guide = { position: 'absolute' as const, backgroundColor: 'rgba(255,255,255,0.45)' };
