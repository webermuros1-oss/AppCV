import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSessionStore } from '../state/sessionStore';

type Toughness = 1 | 2 | 3 | 4 | 5;

interface Props {
  onStarted: () => void;
}

export default function HomeScreen({ onStarted }: Props) {
  const [jobRole, setJobRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [toughness, setToughness] = useState<Toughness>(3);

  const status = useSessionStore((s) => s.status);
  const error = useSessionStore((s) => s.error);
  const startSession = useSessionStore((s) => s.startSession);
  const reset = useSessionStore((s) => s.reset);

  const busy = status === 'starting';
  const canSubmit = jobRole.trim().length > 0 && industry.trim().length > 0 && !busy;

  async function handleStart() {
    if (!canSubmit) return;
    await startSession({
      jobRole: jobRole.trim(),
      industry: industry.trim(),
      toughness,
      durationMin: 10,
      locale: 'es-ES',
    });
    const after = useSessionStore.getState();
    if (after.status === 'live') {
      onStarted();
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Entrevista de práctica</Text>
      <Text style={styles.subtitle}>
        Configura la entrevista. Luego te escucharemos por voz.
      </Text>

      <Text style={styles.label}>Puesto</Text>
      <TextInput
        style={styles.input}
        value={jobRole}
        onChangeText={setJobRole}
        placeholder="p. ej. desarrollador backend"
        autoCorrect={false}
      />

      <Text style={styles.label}>Sector</Text>
      <TextInput
        style={styles.input}
        value={industry}
        onChangeText={setIndustry}
        placeholder="p. ej. banca, retail, salud"
        autoCorrect={false}
      />

      <Text style={styles.label}>Dureza del entrevistador (1 = amable, 5 = incómodo)</Text>
      <View style={styles.toughnessRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = toughness === n;
          return (
            <Pressable
              key={n}
              onPress={() => setToughness(n as Toughness)}
              style={[styles.toughnessBtn, selected && styles.toughnessBtnSelected]}
            >
              <Text style={[styles.toughnessText, selected && styles.toughnessTextSelected]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleStart}
        disabled={!canSubmit}
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Empezar entrevista</Text>
        )}
      </Pressable>

      {status === 'error' && error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={reset} style={styles.linkBtn}>
            <Text style={styles.linkText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  toughnessRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toughnessBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  toughnessBtnSelected: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  toughnessText: {
    fontSize: 16,
    color: '#333',
  },
  toughnessTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#0a6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#9bd3bb',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fde8e8',
    borderRadius: 6,
  },
  errorText: {
    color: '#a11',
  },
  linkBtn: {
    marginTop: 6,
  },
  linkText: {
    color: '#06c',
    textDecorationLine: 'underline',
  },
});
