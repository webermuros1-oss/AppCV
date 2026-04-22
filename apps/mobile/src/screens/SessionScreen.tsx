import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSessionStore } from '../state/sessionStore';
import {
  createSpeechRecognizer,
  createVoiceEngine,
  type SpeechRecognizer,
  type VoiceEngine,
} from '../core/voice';
import type { InterviewTurn } from '@app/shared';

interface Props {
  onEnded: () => void;
}

export default function SessionScreen({ onEnded }: Props) {
  const turns = useSessionStore((s) => s.turns);
  const status = useSessionStore((s) => s.status);
  const error = useSessionStore((s) => s.error);
  const pushUserAnswer = useSessionStore((s) => s.pushUserAnswer);
  const endSession = useSessionStore((s) => s.endSession);

  const voiceRef = useRef<VoiceEngine | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const lastSpokenIdxRef = useRef<number>(-1);

  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);

  useEffect(() => {
    voiceRef.current = createVoiceEngine();
    const rec = createSpeechRecognizer();
    rec.onResult((text) => {
      setDraft(text);
      setListening(false);
    });
    rec.onError((err) => {
      setSttError(err.message);
      setListening(false);
    });
    recognizerRef.current = rec;
    return () => {
      voiceRef.current?.stop();
      recognizerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (turns.length === 0) return;
    const lastIdx = turns.length - 1;
    const last = turns[lastIdx];
    if (last && last.role === 'interviewer' && lastIdx !== lastSpokenIdxRef.current) {
      lastSpokenIdxRef.current = lastIdx;
      voiceRef.current?.speak(last.text).catch(() => {
        // si falla TTS no queremos romper la UI
      });
    }
  }, [turns]);

  const scrollRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [turns.length]);

  const ending = status === 'ending';
  const waitingForReply = useMemo(() => {
    if (turns.length === 0) return false;
    const last = turns[turns.length - 1];
    return last?.role === 'candidate';
  }, [turns]);

  function handleMic() {
    setSttError(null);
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    voiceRef.current?.stop();
    setDraft('');
    setListening(true);
    recognizerRef.current?.start();
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || waitingForReply) return;
    setDraft('');
    await pushUserAnswer(text);
  }

  async function handleEnd() {
    recognizerRef.current?.stop();
    voiceRef.current?.stop();
    await endSession();
    const after = useSessionStore.getState();
    if (after.status === 'reported') {
      onEnded();
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {turns.map((t, i) => (
          <TurnBubble key={`${i}-${t.timestamp}`} turn={t} />
        ))}
        {waitingForReply ? (
          <View style={[styles.bubble, styles.bubbleInterviewer]}>
            <ActivityIndicator />
          </View>
        ) : null}
      </ScrollView>

      {sttError ? (
        <View style={styles.sttError}>
          <Text style={styles.sttErrorText}>{sttError}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          onPress={handleMic}
          style={[styles.micBtn, listening && styles.micBtnActive]}
          disabled={ending || waitingForReply}
        >
          <Text style={styles.micBtnText}>
            {listening ? 'Escuchando… (tocar para parar)' : Platform.OS === 'web' ? 'Hablar (micrófono)' : 'Pulsar para hablar'}
          </Text>
        </Pressable>

        <TextInput
          value={draft}
          onChangeText={setDraft}
          style={styles.draftInput}
          placeholder="Edita o escribe tu respuesta antes de enviar"
          multiline
          editable={!ending}
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || ending || waitingForReply}
            style={[
              styles.sendBtn,
              (!draft.trim() || ending || waitingForReply) && styles.btnDisabled,
            ]}
          >
            <Text style={styles.sendBtnText}>Enviar</Text>
          </Pressable>

          <Pressable
            onPress={handleEnd}
            disabled={ending}
            style={[styles.endBtn, ending && styles.btnDisabled]}
          >
            {ending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.endBtnText}>Terminar</Text>
            )}
          </Pressable>
        </View>

        {status === 'error' && error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

function TurnBubble({ turn }: { turn: InterviewTurn }) {
  const isInterviewer = turn.role === 'interviewer';
  return (
    <View
      style={[
        styles.bubble,
        isInterviewer ? styles.bubbleInterviewer : styles.bubbleCandidate,
      ]}
    >
      <Text style={styles.bubbleLabel}>
        {isInterviewer ? 'Entrevistador/a' : 'Tú'}
      </Text>
      <Text style={styles.bubbleText}>{turn.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    padding: 12,
    borderRadius: 10,
    maxWidth: '90%',
  },
  bubbleInterviewer: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2f6',
  },
  bubbleCandidate: {
    alignSelf: 'flex-end',
    backgroundColor: '#d6efe0',
  },
  bubbleLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: '#111',
  },
  controls: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  micBtn: {
    backgroundColor: '#06c',
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#c0392b',
  },
  micBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  draftInput: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sendBtn: {
    flex: 1,
    backgroundColor: '#0a6',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  endBtn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  endBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sttError: {
    padding: 8,
    backgroundColor: '#fff4e5',
  },
  sttErrorText: {
    color: '#a65',
    fontSize: 13,
  },
  errorText: {
    color: '#a11',
    fontSize: 13,
  },
});
