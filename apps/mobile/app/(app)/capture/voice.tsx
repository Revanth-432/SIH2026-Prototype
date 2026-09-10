import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useDraftStore } from '../../../src/store/useDraftStore';
import { useAuthStore } from '../../../src/store/useAuthStore';

export default function CaptureVoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, isLoading } = useAuthStore();

  // Role Protection Guard
  useEffect(() => {
    if (!isLoading && role && (role === 'BUYER' || role === 'B2B_BUYER')) {
      router.replace('/(app)/buyer/feed');
    }
  }, [role, isLoading, router]);

  const { audioUri, setAudioUri } = useDraftStore();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(audioUri);
  const [isRecording, setIsRecording] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Clean up sound and recording on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Duration timer during recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'माइक्रोफ़ोन अनुमति आवश्यक है (Permission Required)',
          'Please grant microphone permission to record your voice description.',
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(recording);
      setIsRecording(true);
      setDurationSec(0);
      setRecordedUri(null);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      if (uri) {
        setRecordedUri(uri);
        setAudioUri(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true },
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play audio', err);
    }
  };

  const handleProceed = () => {
    if (recordedUri) {
      setAudioUri(recordedUri);
    }
    router.push('/(app)/capture/processing');
  };

  const handleSkip = () => {
    setAudioUri(null);
    router.push('/(app)/capture/processing');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View
      className="flex-1 bg-artisan-canvas"
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-artisan-border bg-white px-6 py-4">
        <TouchableOpacity
          key="btn-header-back"
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
        >
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xl font-bold text-artisan-slate">
            Step 2 of 3: Voice
          </Text>
          <Text className="text-xs font-semibold text-artisan-amber">
            कदम 2: आवाज़ में विवरण
          </Text>
        </View>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        {/* Simple Bilingual Prompt Banner */}
        <View className="mb-8 w-full rounded-3xl bg-white p-6 border border-artisan-border shadow-sm">
          <Text className="text-xl font-bold text-artisan-slate text-center">
            Tell us about your craft
          </Text>
          <Text className="mt-1 text-base font-medium text-artisan-amber text-center">
            अपनी भाषा में बोलें (सामग्री, बनाने का तरीका)
          </Text>
          <Text className="mt-2 text-center text-sm text-artisan-muted">
            Speak in Hindi, English, or your local regional language. Our AI will understand!
          </Text>
        </View>

        {/* Massive Animated Microphone Button Area */}
        <View className="my-6 items-center">
          {isRecording ? (
            <TouchableOpacity
              key="btn-recording-stop"
              onPress={stopRecording}
              activeOpacity={0.85}
              className="h-44 w-44 items-center justify-center rounded-full bg-red-500 shadow-2xl shadow-red-500/50 border-8 border-red-200"
            >
              <Square color="#FFFFFF" size={56} fill="#FFFFFF" />
              <Text className="mt-2 text-base font-extrabold text-white">
                Tap to Stop
              </Text>
            </TouchableOpacity>
          ) : recordedUri ? (
            <TouchableOpacity
              key="btn-recording-play"
              onPress={playRecordedAudio}
              activeOpacity={0.85}
              className="h-44 w-44 items-center justify-center rounded-full bg-green-600 shadow-2xl shadow-green-600/40 border-8 border-green-200"
            >
              <Play color="#FFFFFF" size={56} fill="#FFFFFF" />
              <Text className="mt-2 text-base font-extrabold text-white">
                {isPlaying ? 'Playing...' : 'Tap to Listen'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key="btn-recording-start"
              onPress={startRecording}
              activeOpacity={0.85}
              className="h-44 w-44 items-center justify-center rounded-full bg-artisan-amber shadow-2xl shadow-artisan-amber/40 border-8 border-amber-200"
            >
              <Mic color="#FFFFFF" size={64} />
              <Text className="mt-2 text-base font-extrabold text-white">
                Tap to Speak
              </Text>
            </TouchableOpacity>
          )}

          {/* Recording Timer / Status Indicator */}
          <View className="mt-6 items-center">
            {isRecording ? (
              <View key="status-recording" className="flex-row items-center rounded-full bg-red-100 px-5 py-2">
                <View className="mr-2 h-3 w-3 rounded-full bg-red-600" />
                <Text className="text-xl font-bold font-mono text-red-700">
                  Recording: {formatTimer(durationSec)}
                </Text>
              </View>
            ) : recordedUri ? (
              <View key="status-recorded" className="flex-row items-center rounded-full bg-green-100 px-5 py-2">
                <Text className="text-base font-bold text-green-800">
                  ✓ Voice Note Recorded / आवाज़ तैयार है
                </Text>
              </View>
            ) : (
              <Text key="status-idle" className="text-base font-medium text-artisan-muted">
                आवाज़ रिकॉर्ड करने के लिए बटन दबाएं
              </Text>
            )}
          </View>
        </View>

        {/* Next & Options Actions */}
        <View className="w-full mt-6 space-y-4">
          {recordedUri ? (
            <View key="actions-recorded" className="w-full">
              {/* Primary AI Generation Button */}
              <TouchableOpacity
                key="btn-proceed-catalog"
                onPress={handleProceed}
                activeOpacity={0.85}
                className="h-20 flex-row items-center justify-center rounded-2xl bg-artisan-primary shadow-lg shadow-artisan-primary/30"
              >
                <Sparkles color="#FFFFFF" size={28} />
                <Text className="ml-3 text-2xl font-extrabold text-white">
                  Generate Catalog / AI विश्लेषण
                </Text>
              </TouchableOpacity>

              {/* Re-record Button */}
              <TouchableOpacity
                key="btn-rerecord-voice"
                onPress={startRecording}
                activeOpacity={0.85}
                className="mt-4 h-16 flex-row items-center justify-center rounded-2xl border-2 border-artisan-border bg-white"
              >
                <RotateCcw color="#64748B" size={22} />
                <Text className="ml-3 text-lg font-bold text-artisan-slate">
                  Re-record / दोबारा बोलें
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View key="actions-unrecorded" className="w-full">
              {/* Skip Option (Allowed when user only wants to upload photo) */}
              <TouchableOpacity
                key="btn-skip-voice"
                onPress={handleSkip}
                activeOpacity={0.85}
                className="h-16 flex-row items-center justify-center rounded-2xl border-2 border-artisan-border bg-white"
              >
                <Text className="text-lg font-bold text-artisan-muted">
                  Skip Voice Step / आवाज़ छोडें
                </Text>
                <ArrowRight color="#64748B" size={20} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
