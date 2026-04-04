import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAttendanceStore, SubjectAttendance } from '../store/useAttendanceStore';

// ─── Ring component (View-based, no SVG) ────────────────────────────────────
function Ring({ percent, color }: { percent: number; color: string }) {
  const size = 80;
  const stroke = 7;
  // Approximate arc using quadrant-based border coloring
  const q1 = percent > 25;  // right
  const q2 = percent > 50;  // bottom
  const q3 = percent > 75;  // left
  const q4 = percent > 0;   // top (always on if any progress)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: stroke,
        borderColor: 'rgba(255,255,255,0.06)',
      }} />
      {/* Fill arc (quadrant approximation) */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: stroke,
        borderTopColor: q4 ? color : 'transparent',
        borderRightColor: q1 ? color : 'transparent',
        borderBottomColor: q2 ? color : 'transparent',
        borderLeftColor: q3 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{percent}%</Text>
    </View>
  );
}

// ─── Bunk banner ─────────────────────────────────────────────────────────────
function BunkBanner({ overall, safeTotal }: { overall: number; safeTotal: number }) {
  let msg: string;
  let msgColor: string;

  if (overall >= 85) {
    msg = `You can skip up to ${safeTotal} more classes safely`;
    msgColor = '#10B981';
  } else if (overall >= 75) {
    msg = "You're just above the limit. Be careful!";
    msgColor = '#F59E0B';
  } else {
    const needed = Math.ceil((0.75 * (safeTotal + 1) - 0) / 0.25); // approx
    msg = `⚠️ Below 75%! Attend more classes to recover.`;
    msgColor = '#EF4444';
  }

  return (
    <View style={styles.bunkBanner}>
      <Text style={styles.bunkTitle}>⚡ Bunk Calculator</Text>
      <Text style={[styles.bunkMsg, { color: msgColor }]}>{msg}</Text>
    </View>
  );
}

// ─── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ s, canSkip, onMark }: {
  s: SubjectAttendance;
  canSkip: number;
  onMark: (type: 'class' | 'lab', present: boolean) => void;
}) {
  const pct = s.total === 0 ? 0 : Math.round((s.attended / s.total) * 100);
  const below = pct < 75;
  const atLimit = !below && canSkip === 0;

  let skipLabel: string;
  let skipColor: string;
  if (below) {
    const needed = Math.ceil((0.75 * s.total - s.attended) / 0.25);
    skipLabel = `Need ${needed} more`;
    skipColor = '#EF4444';
  } else if (atLimit) {
    skipLabel = 'At limit';
    skipColor = '#F59E0B';
  } else {
    skipLabel = `Can skip ${canSkip} more`;
    skipColor = '#10B981';
  }

  return (
    <View style={styles.subjectCard}>
      {/* Top row */}
      <View style={styles.subjectTopRow}>
        <View style={styles.subjectLeft}>
          <View style={[styles.subjectDot, { backgroundColor: s.color }]} />
          <Text style={styles.subjectName}>{s.subject}</Text>
        </View>
        <Text style={[styles.subjectPct, { color: s.color }]}>{pct}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: s.color }]} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsLeft}>{s.attended} / {s.total} classes</Text>
        <Text style={[styles.statsRight, { color: skipColor }]}>{skipLabel}</Text>
      </View>

      {/* Mark class attendance */}
      <View style={styles.markRow}>
        <Text style={styles.markLabel}>Mark today:</Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={styles.presentPill}
            onPress={() => onMark('class', true)}
            activeOpacity={0.75}
          >
            <Text style={styles.presentText}>✓ Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.absentPill}
            onPress={() => onMark('class', false)}
            activeOpacity={0.75}
          >
            <Text style={styles.absentText}>✗ Absent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mark lab attendance (only if has labs) */}
      {s.labTotal > 0 && (
        <View style={styles.markRow}>
          <Text style={styles.markLabel}>
            Mark lab: ({s.labAttended}/{s.labTotal})
          </Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={styles.presentPill}
              onPress={() => onMark('lab', true)}
              activeOpacity={0.75}
            >
              <Text style={styles.presentText}>✓ Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.absentPill}
              onPress={() => onMark('lab', false)}
              activeOpacity={0.75}
            >
              <Text style={styles.absentText}>✗ Absent</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function Attendance() {
  const router = useRouter();
  const { subjects, markAttendance, getOverallAttendance, getOverallLab, getSafeToSkip } =
    useAttendanceStore();

  const overall = getOverallAttendance();
  const overallLab = getOverallLab();

  const totalAttended = subjects.reduce((a, b) => a + b.attended, 0);
  const totalClasses = subjects.reduce((a, b) => a + b.total, 0);
  const totalLabAttended = subjects.filter((s) => s.labTotal > 0).reduce((a, b) => a + b.labAttended, 0);
  const totalLabs = subjects.filter((s) => s.labTotal > 0).reduce((a, b) => a + b.labTotal, 0);
  const safeTotal = subjects.reduce((sum, s) => sum + getSafeToSkip(s.id), 0);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Overview rings */}
        <View style={styles.ringsRow}>
          <View style={styles.ringCard}>
            <Ring percent={overall} color="#7C3AED" />
            <Text style={styles.ringLabel}>Attendance</Text>
            <Text style={styles.ringSubLabel}>{totalAttended} / {totalClasses} classes</Text>
          </View>
          <View style={styles.ringCard}>
            <Ring percent={overallLab} color="#10B981" />
            <Text style={styles.ringLabel}>Lab Sessions</Text>
            <Text style={styles.ringSubLabel}>{totalLabAttended} / {totalLabs} labs</Text>
          </View>
        </View>

        {/* Bunk calculator */}
        <BunkBanner overall={overall} safeTotal={safeTotal} />

        {/* Subject list */}
        <Text style={styles.sectionLabel}>BY SUBJECT</Text>
        {subjects.map((s) => (
          <SubjectCard
            key={s.id}
            s={s}
            canSkip={getSafeToSkip(s.id)}
            onMark={(type, present) => markAttendance(s.id, type, present)}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backArrow: { fontSize: 22, color: '#F8FAFC', width: 32 },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // Rings
  ringsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  ringCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  ringLabel: { fontSize: 12, color: '#64748B', marginTop: 10 },
  ringSubLabel: { fontSize: 11, color: '#475569', marginTop: 4 },

  // Bunk banner
  bunkBanner: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    marginBottom: 20,
  },
  bunkTitle: { fontSize: 13, color: '#7C3AED', fontWeight: '600', marginBottom: 6 },
  bunkMsg: { fontSize: 13 },

  // Section label
  sectionLabel: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Subject card
  subjectCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  subjectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  subjectDot: { width: 8, height: 8, borderRadius: 4 },
  subjectName: { fontSize: 15, color: '#FFFFFF', fontWeight: '500', flex: 1 },
  subjectPct: { fontSize: 16, fontWeight: '700' },

  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 10,
  },
  progressFill: { height: 4, borderRadius: 999 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statsLeft: { fontSize: 11, color: '#64748B' },
  statsRight: { fontSize: 11 },

  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  markLabel: { fontSize: 12, color: '#64748B' },
  pillRow: { flexDirection: 'row', gap: 8 },
  presentPill: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presentText: { color: '#10B981', fontSize: 12 },
  absentPill: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  absentText: { color: '#EF4444', fontSize: 12 },
});
