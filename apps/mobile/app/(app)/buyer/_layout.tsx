import React from 'react';
import { Stack } from 'expo-router';

export default function BuyerLayout() {
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
