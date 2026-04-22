import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSessionStore } from '../state/sessionStore';

interface Props {
  onBackHome: () => void;
}

export default function ReportScreen({ onBackHome }: Props) {
  const report = useSessionStore((s) => s.report);
  const turns = useSessionStore((s) => s.turns);
  const reset = useSessionStore((s) => s.reset);

  function handleBack() {
    reset();
    onBackHome();
  }

  if (!report) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Sin reporte</Text>
        <Text style={styles.body}>No hay datos de sesión.</Text>
        <Pressable onPress={handleBack} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tu reporte</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Claridad</Text>
        <Text style={styles.scoreText}>{report.clarity} / 100</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Confianza</Text>
        <Text style={styles.scoreText}>{report.confidence} / 100</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Muletillas detectadas</Text>
        <Text style={styles.scoreText}>{report.fillerWords}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Sugerencias</Text>
        {report.suggestions.length === 0 ? (
          <Text style={styles.body}>Sin sugerencias.</Text>
        ) : (
          report.suggestions.map((s, i) => (
            <Text key={i} style={styles.suggestion}>
              {i + 1}. {s}
            </Text>
          ))
        )}
      </View>

      <Text style={[styles.title, styles.transcriptTitle]}>Transcripción</Text>
      {turns.map((t, i) => (
        <View key={i} style={styles.transcriptRow}>
          <Text style={styles.transcriptRole}>
            {t.role === 'interviewer' ? 'Entrevistador/a' : 'Tú'}
          </Text>
          <Text style={styles.transcriptText}>{t.text}</Text>
        </View>
      ))}

      <Pressable onPress={handleBack} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Volver al inicio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  transcriptTitle: {
    marginTop: 20,
    fontSize: 18,
  },
  body: {
    fontSize: 14,
    color: '#555',
  },
  card: {
    padding: 14,
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    gap: 6,
  },
  cardLabel: {
    fontSize: 13,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  suggestion: {
    fontSize: 14,
    color: '#222',
    marginTop: 4,
  },
  transcriptRow: {
    paddingVertical: 6,
  },
  transcriptRole: {
    fontSize: 12,
    color: '#777',
  },
  transcriptText: {
    fontSize: 14,
    color: '#111',
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
