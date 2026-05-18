import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadAISettings, saveAISettings } from '../../store/ai';
import { Field, Input, Slider, Select, SaveButton, SettingsPageHeader } from '../../ui';
import type { SelectOption } from '../../ui';
import { hasUnsavedAIConfigChanges } from './ai-config-utils';
import { useSettingsTabGuard } from './useSettingsTabGuard';
import styles from './SettingsCommon.module.css';

const TTS_PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'minimax', label: 'MiniMax TTS' },
  { value: 'edge-tts', label: 'Edge TTS（免费）' },
];

const MINIMAX_MODEL_OPTIONS: SelectOption[] = [
  { value: 'speech-2.8-hd', label: 'speech-2.8-hd' },
  { value: 'speech-2.8-turbo', label: 'speech-2.8-turbo' },
  { value: 'speech-2.6-hd', label: 'speech-2.6-hd' },
  { value: 'speech-2.6-turbo', label: 'speech-2.6-turbo' },
  { value: 'speech-02-hd', label: 'speech-02-hd' },
  { value: 'speech-02-turbo', label: 'speech-02-turbo' },
  { value: 'speech-01-hd', label: 'speech-01-hd' },
  { value: 'speech-01-turbo', label: 'speech-01-turbo' },
];

const EMOTION_OPTIONS: SelectOption[] = [
  { value: '', label: '自动（模型判断）' },
  { value: 'happy', label: '高兴' },
  { value: 'sad', label: '悲伤' },
  { value: 'angry', label: '愤怒' },
  { value: 'fearful', label: '害怕' },
  { value: 'disgusted', label: '厌恶' },
  { value: 'surprised', label: '惊讶' },
  { value: 'calm', label: '中性' },
  { value: 'fluent', label: '生动（2.6 系列）' },
];

const EDGE_TTS_VOICE_OPTIONS: SelectOption[] = [
  { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女声）' },
  { value: 'zh-CN-XiaoyiNeural', label: '晓伊（女声）' },
  { value: 'zh-CN-XiaohanNeural', label: '晓涵（女声）' },
  { value: 'zh-CN-XiaomengNeural', label: '晓萌（女声）' },
  { value: 'zh-CN-XiaochenNeural', label: '晓辰（女声）' },
  { value: 'zh-CN-XiaoxuanNeural', label: '晓萱（女声）' },
  { value: 'zh-CN-XiaoshuangNeural', label: '晓双（女声·儿童）' },
  { value: 'zh-CN-XiaochenNeural', label: '晓辰（女声·小说）' },
  { value: 'zh-CN-YunxiNeural', label: '云希（男声）' },
  { value: 'zh-CN-YunyangNeural', label: '云扬（男声·新闻）' },
  { value: 'zh-CN-YunjianNeural', label: '云健（男声）' },
  { value: 'zh-CN-YunhaoNeural', label: '云皓（男声）' },
  { value: 'zh-CN-YunyeNeural', label: '云野（男声·可爱）' },
  { value: 'zh-CN-YunxiaNeural', label: '云夏（男声·小说）' },
  { value: 'zh-CN-YunzeNeural', label: '云泽（男声·播客）' },
  { value: 'zh-CN-YufengNeural', label: '语枫（男声·情感）' },
  { value: 'zh-HK-HiuMaanNeural', label: '晓曼（粤语·女声）' },
  { value: 'zh-HK-HiuGaaiNeural', label: '晓佳（粤语·男声）' },
  { value: 'zh-TW-HsiaoChenNeural', label: '晓臻（国语·女声）' },
  { value: 'zh-TW-HsiaoYuNeural', label: '晓雨（国语·女声）' },
  { value: 'zh-TW-YunJheNeural', label: '云哲（国语·男声）' },
  { value: 'en-US-AnaNeural', label: 'Ana（美式·女声·儿童）' },
  { value: 'en-US-AriaNeural', label: 'Aria（美式·女声）' },
  { value: 'en-US-JennyNeural', label: 'Jenny（美式·女声）' },
  { value: 'en-US-GuyNeural', label: 'Guy（美式·男声）' },
  { value: 'en-GB-SoniaNeural', label: 'Sonia（英式·女声）' },
  { value: 'en-GB-RyanNeural', label: 'Ryan（英式·男声）' },
  { value: 'ja-JP-NanamiNeural', label: 'Nanami（日语·女声）' },
  { value: 'ja-JP-KeitaNeural', label: 'Keita（日语·男声）' },
  { value: 'ko-KR-SunHiNeural', label: 'Sun-Hi（韩语·女声）' },
  { value: 'ko-KR-InJoonNeural', label: 'InJoon（韩语·男声）' },
];

interface TTSConfigTabProps {
  onRegisterLeaveGuard?: (guard: (() => Promise<boolean>) | null) => void;
}

const SNAPSHOT_FIELDS = {
  ttsProvider: true,
  apiKey: true,
  model: true,
  voiceId: true,
  speed: true,
  vol: true,
  pitch: true,
  emotion: true,
  edgeTtsVoice: true,
} as const;

type SnapshotData = {
  [K in keyof typeof SNAPSHOT_FIELDS]: string;
};

function createTTSSnapshot(data: SnapshotData): string {
  return JSON.stringify(data);
}

export function TTSConfigTab({ onRegisterLeaveGuard }: TTSConfigTabProps) {
  const [ttsProvider, setTtsProvider] = useState<'minimax' | 'edge-tts'>('minimax');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('speech-2.8-hd');
  const [voiceId, setVoiceId] = useState('male-qn-qingse');
  const [speed, setSpeed] = useState(1.0);
  const [vol, setVol] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [emotion, setEmotion] = useState('');
  const [edgeTtsVoice, setEdgeTtsVoice] = useState('zh-CN-XiaoxiaoNeural');
  const [saved, setSaved] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState('');
  const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadAISettings().then((s) => {
      const nextProvider = (s?.ttsProvider ?? 'minimax') as 'minimax' | 'edge-tts';
      const nextApiKey = s?.minimaxApiKey ?? '';
      const nextModel = s?.minimaxModel ?? 'speech-2.8-hd';
      const nextVoiceId = s?.minimaxVoiceId ?? 'male-qn-qingse';
      const nextSpeed = s?.minimaxSpeed ?? 1.0;
      const nextVol = s?.minimaxVol ?? 1.0;
      const nextPitch = s?.minimaxPitch ?? 0;
      const nextEmotion = s?.minimaxEmotion ?? '';
      const nextEdgeVoice = s?.edgeTtsVoice ?? 'zh-CN-XiaoxiaoNeural';

      setTtsProvider(nextProvider);
      setApiKey(nextApiKey);
      setModel(nextModel);
      setVoiceId(nextVoiceId);
      setSpeed(nextSpeed);
      setVol(nextVol);
      setPitch(nextPitch);
      setEmotion(nextEmotion);
      setEdgeTtsVoice(nextEdgeVoice);
      setLastSavedSnapshot(
        createTTSSnapshot({
          ttsProvider: nextProvider,
          apiKey: nextApiKey,
          model: nextModel,
          voiceId: nextVoiceId,
          speed: String(nextSpeed),
          vol: String(nextVol),
          pitch: String(nextPitch),
          emotion: nextEmotion,
          edgeTtsVoice: nextEdgeVoice,
        }),
      );
      setHasLoaded(true);
    });
  }, []);

  useEffect(
    () => () => {
      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current);
      }
    },
    [],
  );

  const currentSnapshot = useMemo(
    () =>
      createTTSSnapshot({
        ttsProvider,
        apiKey,
        model,
        voiceId,
        speed: String(speed),
        vol: String(vol),
        pitch: String(pitch),
        emotion,
        edgeTtsVoice,
      }),
    [ttsProvider, apiKey, model, voiceId, speed, vol, pitch, emotion, edgeTtsVoice],
  );

  const hasUnsavedChanges =
    hasLoaded && hasUnsavedAIConfigChanges(lastSavedSnapshot, currentSnapshot);

  useEffect(() => {
    if (hasUnsavedChanges && saved) {
      setSaved(false);
    }
  }, [hasUnsavedChanges, saved]);

  const handleSave = useCallback(async () => {
    try {
      const current = await loadAISettings();
      await saveAISettings({
        ...(current ?? {
          llmProviders: [],
          defaultProviderId: null,
          defaultModel: null,
          llmBaseUrl: '',
          llmApiKey: '',
          llmModel: '',
          jimengApiUrl: '',
          jimengSessionId: '',
          imageProviders: [],
          defaultImageProviderId: null,
          defaultImageModel: null,
          videoProviders: [],
          defaultVideoProviderId: null,
          defaultVideoModel: null,
          promptBindings: {},
        }),
        ttsProvider,
        minimaxApiKey: apiKey,
        minimaxModel: model,
        minimaxVoiceId: voiceId,
        minimaxSpeed: speed,
        minimaxVol: vol,
        minimaxPitch: pitch,
        minimaxEmotion: emotion,
        edgeTtsVoice,
      });
      setApiKey(apiKey.trim());
      setVoiceId(voiceId.trim());
      setLastSavedSnapshot(currentSnapshot);
      setSaved(true);
      if (saveFeedbackTimerRef.current) {
        clearTimeout(saveFeedbackTimerRef.current);
      }
      saveFeedbackTimerRef.current = setTimeout(() => setSaved(false), 2000);
      return true;
    } catch (error) {
      window.alert(error instanceof Error ? `保存 TTS 配置失败：${error.message}` : '保存 TTS 配置失败，请稍后重试。');
      return false;
    }
  }, [apiKey, currentSnapshot, edgeTtsVoice, emotion, model, pitch, speed, ttsProvider, voiceId, vol]);

  useSettingsTabGuard({
    title: 'TTS 配置',
    hasUnsavedChanges,
    onSave: handleSave,
    onRegisterLeaveGuard,
  });

  return (
    <>
      <SettingsPageHeader
        title="TTS 语音合成配置"
        description="选择语音合成服务商并配置参数"
      />

      <div className={styles.formStack}>
        <Field label="语音服务">
          <Select
            value={ttsProvider}
            options={TTS_PROVIDER_OPTIONS}
            onChange={(e) => setTtsProvider(e.target.value as 'minimax' | 'edge-tts')}
          />
        </Field>

        {ttsProvider === 'minimax' ? (
          <>
            <Field label="MiniMax API Key">
              <Input
                variant="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="your-api-key"
              />
            </Field>

            <Field label="模型">
              <Select
                value={model}
                options={MINIMAX_MODEL_OPTIONS}
                onChange={(e) => setModel(e.target.value)}
              />
            </Field>

            <Field label="音色 ID" hint="系统音色 ID 或克隆音色 ID，参考 MiniMax 音色列表">
              <Input
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="例如：male-qn-qingse"
              />
            </Field>

            <Field label={`语速：${speed.toFixed(1)}x`} hint="范围 0.5–2.0，默认 1.0">
              <Slider min={0.5} max={2.0} step={0.1} value={speed} onChange={setSpeed} size="md" />
            </Field>

            <Field label={`音量：${vol.toFixed(1)}`} hint="范围 0.1–10，默认 1.0">
              <Slider min={0.1} max={10} step={0.1} value={vol} onChange={setVol} size="md" />
            </Field>

            <Field label={`音调：${pitch > 0 ? '+' : ''}${pitch}`} hint="范围 -12–12，0 为原音色">
              <Slider min={-12} max={12} step={1} value={pitch} onChange={setPitch} size="md" />
            </Field>

            <Field
              label="情绪"
              hint="speech-2.8 系列不支持 whisper；fluent 仅 2.6 系列生效"
            >
              <Select
                value={emotion}
                options={EMOTION_OPTIONS}
                onChange={(e) => setEmotion(e.target.value)}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="音色" hint="选择 Edge TTS 内置音色，无需 API Key">
              <Select
                value={edgeTtsVoice}
                options={EDGE_TTS_VOICE_OPTIONS}
                onChange={(e) => setEdgeTtsVoice(e.target.value)}
              />
            </Field>

            <Field label={`语速：${speed.toFixed(1)}x`} hint="范围 0.5–2.0，默认 1.0">
              <Slider min={0.5} max={2.0} step={0.1} value={speed} onChange={setSpeed} size="md" />
            </Field>

            <Field label={`音调：${pitch > 0 ? '+' : ''}${pitch}`} hint="范围 -12–12，0 为原音色">
              <Slider min={-12} max={12} step={1} value={pitch} onChange={setPitch} size="md" />
            </Field>

            <div className={styles.hintText}>
              Edge TTS 使用微软在线语音合成服务，完全免费，无需任何 API Key。
              支持中文普通话、粤语、英语、日语、韩语等多种语言。
              注意：首次使用需要网络连接。
            </div>
          </>
        )}
      </div>

      <SaveButton
        onClick={() => {
          void handleSave();
        }}
        saved={saved}
        disabled={!hasLoaded || !hasUnsavedChanges}
        defaultLabel="保存 TTS 配置"
        className={styles.saveButton}
      />
    </>
  );
}
