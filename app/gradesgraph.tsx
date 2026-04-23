import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubjectsStore, calculateGrade, calculateGPA } from '../store/useSubjectsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 48;
const CHART_H = 180;

const SUBJECT_COLORS = [
  '#7C3AED', '#3B82F6', '#10B981', '#F59E0B',
  '#EC4899', '#EF4444', '#06B6D4', '#8B5CF6',
];

type ChartTab = 'bar' | 'progress' | 'overview';

// ─── Color helpers ────────────────────────────────────────────────────────────

function gradeColor(grade: string) {
  if (grade === 'O' || grade === 'A+') return '#10B981';
  if (grade === 'A' || grade === 'B+') return '#3B82F6';
  if (grade === 'B' || grade === 'C') return '#F59E0B';
  if (grade === 'F') return '#EF4444';
  return '#94A3B8';
}

function scoreColor(score: number) {
  if (score >= 85) return '#10B981';
  if (score >= 65) return '#F59E0B';
  return '#EF4444';
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { name: string; marks: number; color: string }[] }) {
  if (!data.length) return <EmptyChart />;
  const barW = Math.min(40, Math.floor((CHART_W - 32) / data.length) - 8);

  return (
    <View style={{ width: CHART_W }}>
      {[25, 50, 75, 100].map((v) => (
        <View key={v} style={[styles.gridLine, { top: CHART_H * (1 - v / 100) }]}>
          <Text style={styles.gridLabel}>{v}</Text>
        </View>
      ))}
      <View style={[styles.barRow, { height: CHART_H + 36 }]}>
        {data.map((item, i) => {
          const barH = (item.marks / 100) * CHART_H;
          return (
            <View key={i} style={styles.barGroup}>
              <Text style={[styles.barTopLabel, { color: item.color }]}>{item.marks}</Text>
              <View style={[styles.bar, {
                height: barH, width: barW,
                backgroundColor: item.color + '28',
                borderTopWidth: 2.5, borderTopColor: item.color,
                borderLeftWidth: 1, borderLeftColor: item.color + '40',
                borderRightWidth: 1, borderRightColor: item.color + '40',
              }]} />
              <Text style={styles.barBottomLabel} numberOfLines={1}>
                {item.name.length > 5 ? item.name.slice(0, 5) + '…' : item.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Progress Bars ────────────────────────────────────────────────────────────

function ProgressBars({ data }: { data: { name: string; marks: number; grade: string; color: string }[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <View style={{ width: CHART_W, gap: 14 }}>
      {data.map((item, i) => (
        <View key={i}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressSubjectName} numberOfLines={1}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.progressGrade, { color: gradeColor(item.grade) }]}>{item.grade}</Text>
              <Text style={[styles.progressScore, { color: item.color }]}>{item.marks}%</Text>
            </View>
          </View>
          <View style={styles.hProgressTrack}>
            <View style={[styles.hProgressFill, { width: `${item.marks}%` as any, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Overview (ring + legend) ─────────────────────────────────────────────────

function OverviewChart({ data, cgpa }: { data: { name: string; marks: number; color: string }[]; cgpa: number }) {
  if (!data.length) return <EmptyChart />;
  const RADIUS = 62, STROKE = 14;
  const SIZE = (RADIUS + STROKE + 4) * 2;

  return (
    <View style={styles.overviewContainer}>
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          position: 'absolute', width: RADIUS * 2, height: RADIUS * 2,
          borderRadius: RADIUS, borderWidth: STROKE, borderColor: 'rgba(255,255,255,0.05)',
        }} />
        {data.map((item, i) => {
          const fraction = item.marks / 100;
          const rotate = (i / data.length) * 360 - 90;
          return (
            <View key={i} style={{
              position: 'absolute', width: RADIUS * 2, height: RADIUS * 2,
              borderRadius: RADIUS, borderWidth: STROKE,
              borderTopColor: item.color,
              borderRightColor: fraction >= 0.25 ? item.color : 'transparent',
              borderBottomColor: fraction >= 0.5 ? item.color : 'transparent',
              borderLeftColor: fraction >= 0.75 ? item.color : 'transparent',
              transform: [{ rotate: `${rotate}deg` }], opacity: 0.85,
            }} />
          );
        })}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.ringCenter}>{cgpa.toFixed(2)}</Text>
          <Text style={styles.ringCenterLabel}>CGPA</Text>
        </View>
      </View>
      <View style={styles.ringLegend}>
        {data.map((item, i) => (
          <View key={i} style={styles.ringLegendRow}>
            <View style={[styles.ringLegendDot, { backgroundColor: item.color }]} />
            <Text style={styles.ringLegendName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.ringLegendScore, { color: item.color }]}>{item.marks}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyChart() {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyChartText}>No graded subjects yet.</Text>
      <Text style={styles.emptyChartSub}>Add marks in Subjects first.</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GradeGraph() {
  const router = useRouter();
  const { subjects, isLoading, fetchSubjects, getOverallCGPA, getSemesterSubjects, getAllSemesters } = useSubjectsStore();

  useEffect(() => { fetchSubjects(); }, []);

  const semesters = getAllSemesters();
  const cgpa = getOverallCGPA();

  const [selectedSem, setSelectedSem] = useState<number | null>(null);
  const [chartTab, setChartTab] = useState<ChartTab>('bar');

  // Set default semester once subjects load
  useEffect(() => {
    if (semesters.length > 0 && selectedSem === null) {
      setSelectedSem(semesters[0]);
    }
  }, [semesters.length]);

  const activeSem = selectedSem ?? semesters[0];
  const semSubjects = activeSem ? getSemesterSubjects(activeSem) : [];
  const gradedSubjects = semSubjects.filter((s) => s.marks !== undefined);
  const semGPA = calculateGPA(gradedSubjects);

  const chartData = gradedSubjects.map((s, i) => ({
    name: s.name,
    marks: s.marks!,
    grade: calculateGrade(s.marks!),
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    credits: s.credits,
  }));

  const sorted = [...chartData].sort((a, b) => b.marks - a.marks);
  const best = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const needsMarks = semSubjects.length - gradedSubjects.length;

  if (isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <Text style={{ color: '#64748B', marginTop: 12 }}>Loading grades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grade Analytics</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/subjects')}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Stat cards */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: '#7C3AED44' }]}>
            <Text style={styles.statLabel}>Sem GPA</Text>
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>{semGPA.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#3B82F644' }]}>
            <Text style={styles.statLabel}>CGPA</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{cgpa.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#10B98144' }]}>
            <Text style={styles.statLabel}>Graded</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{gradedSubjects.length}</Text>
          </View>
        </View>

        {/* Insight cards */}
        {best && weakest && best.name !== weakest.name && (
          <View style={styles.insightRow}>
            <View style={[styles.insightCard, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: '#10B98133' }]}>
              <Text style={styles.insightLabel}>Strongest</Text>
              <Text style={styles.insightSubject} numberOfLines={1}>{best.name}</Text>
              <Text style={[styles.insightScore, { color: '#10B981' }]}>{best.marks}%  ·  {best.grade}</Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#EF444433' }]}>
              <Text style={styles.insightLabel}>Needs Work</Text>
              <Text style={styles.insightSubject} numberOfLines={1}>{weakest.name}</Text>
              <Text style={[styles.insightScore, { color: '#EF4444' }]}>{weakest.marks}%  ·  {weakest.grade}</Text>
            </View>
          </View>
        )}

        {/* Semester tabs */}
        {semesters.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.semTabs} style={styles.semTabsScroll}>
            {semesters.map((sem) => (
              <TouchableOpacity key={sem}
                style={[styles.semTab, activeSem === sem && styles.semTabActive]}
                onPress={() => setSelectedSem(sem)} activeOpacity={0.75}>
                <Text style={[styles.semTabText, activeSem === sem && styles.semTabTextActive]}>
                  Sem {sem}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Chart type tabs */}
        <View style={styles.chartTabRow}>
          {([
            { key: 'bar' as ChartTab, label: '▊  Bar' },
            { key: 'progress' as ChartTab, label: '▬  Progress' },
            { key: 'overview' as ChartTab, label: '◉  Overview' },
          ]).map(({ key, label }) => (
            <TouchableOpacity key={key}
              style={[styles.chartTab, chartTab === key && styles.chartTabActive]}
              onPress={() => setChartTab(key)} activeOpacity={0.75}>
              <Text style={[styles.chartTabText, chartTab === key && styles.chartTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {chartTab === 'bar' ? `Marks by Subject — Sem ${activeSem}`
              : chartTab === 'progress' ? `Performance Breakdown — Sem ${activeSem}`
              : `Grade Overview — Sem ${activeSem}`}
          </Text>

          {chartData.length > 0 && chartTab === 'bar' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {chartData.map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                    <Text style={{ fontSize: 10, color: '#64748B' }}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.chartArea}>
            {chartTab === 'bar' && <BarChart data={chartData} />}
            {chartTab === 'progress' && <ProgressBars data={chartData} />}
            {chartTab === 'overview' && <OverviewChart data={chartData} cgpa={cgpa} />}
          </View>
        </View>

        {/* Subject detail list */}
        <Text style={styles.sectionTitle}>Semester {activeSem} — All Subjects</Text>

        {semSubjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No subjects this semester</Text>
            <Text style={styles.emptyStateSub}>Go to Subjects to add them.</Text>
            <TouchableOpacity style={styles.goSubjectsBtn} onPress={() => router.push('/subjects')} activeOpacity={0.8}>
              <Text style={styles.goSubjectsBtnText}>Go to Subjects →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          semSubjects.map((s, i) => {
            const grade = s.marks !== undefined ? calculateGrade(s.marks) : null;
            const colorIdx = gradedSubjects.findIndex((g) => g.name === s.name);
            const color = colorIdx >= 0 ? SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length] : '#334155';

            return (
              <View key={s.id} style={[styles.detailCard, { borderLeftColor: grade ? gradeColor(grade) : '#334155' }]}>
                <View style={styles.detailTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{s.name}</Text>
                    <Text style={styles.detailMeta}>{s.credits} credits · Sem {s.semester}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {grade ? (
                      <>
                        <Text style={[styles.detailMarks, { color: scoreColor(s.marks!) }]}>{s.marks}%</Text>
                        <Text style={[styles.detailGrade, { color: gradeColor(grade) }]}>{grade}</Text>
                      </>
                    ) : (
                      <Text style={styles.detailPending}>No marks yet</Text>
                    )}
                  </View>
                </View>
                {s.marks !== undefined && (
                  <View style={styles.detailProgressTrack}>
                    <View style={[styles.detailProgressFill, { width: `${s.marks}%` as any, backgroundColor: color }]} />
                  </View>
                )}
              </View>
            );
          })
        )}

        {needsMarks > 0 && semSubjects.length > 0 && (
          <TouchableOpacity style={styles.nudgeCard} onPress={() => router.push('/subjects')} activeOpacity={0.8}>
            <Text style={styles.nudgeText}>{needsMarks} subject{needsMarks > 1 ? 's' : ''} still missing marks</Text>
            <Text style={styles.nudgeAction}>Add marks in Subjects →</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
  },
  backArrow: { fontSize: 22, color: '#F8FAFC', width: 32 },
  headerTitle: { fontFamily: 'Georgia', fontSize: 20, color: '#FFFFFF', flex: 1, textAlign: 'center' },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  editBtnText: { color: '#7C3AED', fontSize: 13, fontWeight: '600' },

  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  statValue: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '700' },

  insightRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  insightCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  insightLabel: { fontSize: 10, color: '#64748B', marginBottom: 4, letterSpacing: 0.5 },
  insightSubject: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', marginBottom: 4 },
  insightScore: { fontSize: 12, fontWeight: '600' },

  semTabsScroll: { flexGrow: 0, marginBottom: 14 },
  semTabs: { paddingHorizontal: 20, gap: 8 },
  semTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  semTabActive: { backgroundColor: '#7C3AED' },
  semTabText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  semTabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  chartTabRow: {
    flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1A1A2E',
    borderRadius: 12, padding: 4, marginBottom: 14,
  },
  chartTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  chartTabActive: { backgroundColor: '#7C3AED' },
  chartTabText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  chartTabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  chartCard: {
    marginHorizontal: 20, backgroundColor: '#1A1A2E', borderRadius: 20,
    padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  chartTitle: { fontFamily: 'Georgia', fontSize: 14, color: '#FFFFFF', marginBottom: 12 },
  chartArea: { alignItems: 'center' },

  gridLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)', flexDirection: 'row', alignItems: 'center',
  },
  gridLabel: { fontSize: 9, color: '#334155', width: 22 },

  barRow: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 24, gap: 8 },
  barGroup: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barTopLabel: { fontSize: 10, fontWeight: '700', marginBottom: 3 },
  barBottomLabel: { fontSize: 9, color: '#64748B', marginTop: 5, maxWidth: 44, textAlign: 'center' },

  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressSubjectName: { fontSize: 13, color: '#FFFFFF', fontWeight: '500', flex: 1, marginRight: 8 },
  progressGrade: { fontSize: 12, fontWeight: '700' },
  progressScore: { fontSize: 12, fontWeight: '600', minWidth: 32, textAlign: 'right' },
  hProgressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  hProgressFill: { height: 6, borderRadius: 3 },

  overviewContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 },
  ringCenter: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Georgia', textAlign: 'center' },
  ringCenterLabel: { fontSize: 10, color: '#64748B', textAlign: 'center' },
  ringLegend: { flex: 1, gap: 10 },
  ringLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ringLegendDot: { width: 8, height: 8, borderRadius: 4 },
  ringLegendName: { fontSize: 12, color: '#94A3B8', flex: 1 },
  ringLegendScore: { fontSize: 13, fontWeight: '600' },

  emptyChart: { paddingVertical: 40, alignItems: 'center' },
  emptyChartText: { fontSize: 14, color: '#475569', marginBottom: 4 },
  emptyChartSub: { fontSize: 12, color: '#334155' },

  sectionTitle: { fontFamily: 'Georgia', fontSize: 16, color: '#FFFFFF', marginHorizontal: 20, marginBottom: 12 },

  detailCard: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: '#1A1A2E',
    borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailName: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', marginBottom: 2 },
  detailMeta: { fontSize: 12, color: '#64748B' },
  detailMarks: { fontSize: 18, fontWeight: '700', fontFamily: 'Georgia' },
  detailGrade: { fontSize: 12, fontWeight: '600' },
  detailPending: { fontSize: 12, color: '#475569', fontStyle: 'italic' },
  detailProgressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  detailProgressFill: { height: 3, borderRadius: 2 },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateTitle: { fontSize: 15, color: '#475569', marginBottom: 6 },
  emptyStateSub: { fontSize: 13, color: '#334155', marginBottom: 20 },
  goSubjectsBtn: { backgroundColor: '#7C3AED', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  goSubjectsBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  nudgeCard: {
    marginHorizontal: 20, marginTop: 8, backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  nudgeText: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  nudgeAction: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
});
