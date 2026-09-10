import React from 'react';
import { Stack } from 'expo-router';

export default function ProductLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        freezeOnBlur: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FAF8F5' },
      }}
    />
  );
}
