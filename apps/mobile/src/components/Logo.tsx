import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { COLORS } from './ui';

// Kala Vaani mark: a clay pot (the craft) with voice bars inside (the artisan's voice).
// Same drawing as assets/logo.svg — keep them in sync.
const POT =
  'M200 118 H312 a13 13 0 0 1 0 26 H298 C298 160 304 170 318 178 C378 204 394 250 390 292 C384 352 340 396 290 404 H222 C172 396 128 352 122 292 C118 250 134 204 194 178 C208 170 214 160 214 144 H200 a13 13 0 0 1 0 -26 Z';
const BAR_HEIGHTS = [44, 86, 128, 86, 44];

export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="Kala Vaani">
      <Rect width={512} height={512} rx={116} fill={COLORS.primary} />
      <Path d={POT} fill="#FFF8F0" />
      {BAR_HEIGHTS.map((h, i) => (
        <Rect
          key={i}
          x={256 + (i - 2) * 38 - 11}
          y={294 - h / 2}
          width={22}
          height={h}
          rx={11}
          fill={COLORS.primary}
        />
      ))}
    </Svg>
  );
}
