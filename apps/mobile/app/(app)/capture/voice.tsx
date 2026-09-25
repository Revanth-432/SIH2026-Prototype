import React, { useState, useEffect } from 'react';
import {
  View,
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
  SkipForward,
  CheckCircle2,
} from 'lucide-react-native';
import { useDraftStore } from '../../../src/store/useDraftStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Text, Button, ScreenHeader, StepBar, COLORS } from '../../../src/components/ui';
import { useT } from '../../../src/i18n';

export default function CaptureVoiceScreen() {
  const router = useRouter();
  const { t, language } = useT();
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
                    t('capture.micPermTitle'),
          t('capture.micPermMsg'),
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
      Alert.alert(t('capture.recordFailed'), t('common.somethingWrong'));
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
    <View className="flex-1 bg-artisan-canvas">
      <ScreenHeader
        title={t('capture.speakTitle')}
        onBack={() => router.back()}
      />
      <StepBar step={2} labels={[t('capture.stepPhoto'), t('capture.stepVoice'), t('capture.stepCheck')]} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, alignItems: 'center' }}>
        <Text className="mt-2 text-center text-xl font-bold text-artisan-slate">
                    {t('capture.speakQuestion')}
        </Text>
        <Text className="text-center text-base text-artisan-muted">
          {t('capture.speakAnyLang')}
        </Text>

        {/* Mic */}
        <View className="my-8 items-center">
          {isRecording ? (
            <TouchableOpacity
              key="btn-recording-stop"
              onPress={stopRecording}
              activeOpacity={0.85}
              accessibilityLabel="Stop recording"
              style={micStyle(COLORS.error, '#FECACA')}
            >
              <Square color="#FFFFFF" size={60} fill="#FFFFFF" />
            </TouchableOpacity>
          ) : recordedUri ? (
            <TouchableOpacity
              key="btn-recording-play"
              onPress={playRecordedAudio}
              activeOpacity={0.85}
              accessibilityLabel="Play recording"
              style={micStyle(COLORS.success, '#BBF7D0')}
            >
              <Play color="#FFFFFF" size={64} fill="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key="btn-recording-start"
              onPress={startRecording}
              activeOpacity={0.85}
              accessibilityLabel="Start recording"
              style={micStyle(COLORS.primary, '#F7E9E1')}
            >
              <Mic color="#FFFFFF" size={80} />
            </TouchableOpacity>
          )}

          <View className="mt-5 items-center">
            {isRecording ? (
              <View key="status-recording" className="items-center">
                <Text className="text-4xl font-bold text-artisan-error">{formatTimer(durationSec)}</Text>
                <Text className="text-lg font-bold text-artisan-slate">{t('capture.tapToStop')}</Text>
              </View>
            ) : recordedUri ? (
              <View key="status-recorded" className="items-center">
                <View className="flex-row items-center">
                  <CheckCircle2 color={COLORS.success} size={24} />
                  <Text className="ml-2 text-lg font-bold text-artisan-success">{t('capture.voiceReady')}</Text>
                </View>
                <Text className="text-base text-artisan-muted">
                  {isPlaying ? t('capture.playing') : t('capture.tapToListen')}
                </Text>
              </View>
            ) : (
              <View key="status-idle" className="items-center">
                <Text className="text-lg font-bold text-artisan-slate">{t('capture.tapToSpeak')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Next */}
        <View className="w-full">
          {recordedUri ? (
            <View key="actions-recorded" style={{ gap: 12 }}>
              <Button
                key="btn-proceed-catalog"
                label={t('common.next')}
                icon={Sparkles}
                onPress={handleProceed}
              />
              <Button
                key="btn-rerecord-voice"
                label={t('capture.recordAgain')}
                icon={RotateCcw}
                variant="secondary"
                onPress={startRecording}
              />
            </View>
          ) : (
            <View key="actions-unrecorded">
              <Button
                key="btn-skip-voice"
                label={t('capture.skipVoice')}
                icon={SkipForward}
                variant="ghost"
                onPress={handleSkip}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function micStyle(bg: string, ring: string) {
  return {
    height: 180,
    width: 180,
    borderRadius: 90,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: bg,
    borderWidth: 10,
    borderColor: ring,
  };
}
