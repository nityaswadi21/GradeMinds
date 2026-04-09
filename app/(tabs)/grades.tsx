import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSubjectsStore, calculateGrade, calculateGPA, Subject } from '../../store/useSubjectsStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function barColor(marks: number): string {
  if (marks >= 90) return '#10B981';
  if (marks >= 80) return '#7C3AED';
  if (marks >= 70) return '#3B82F6';
  if (marks >= 60) return '#F59E0B';
  return '#EF4444';
}

function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    O: '#10B981', 'A+': '#7C3AED', A: '#3B82F6',
    'B+': '#F59E0B', B: '#F97316', C: '#94A3B8', P: '#64748B', F: '#EF4444',
  };
  return map[grade] ?? '#94A3B8';
}

function gpaColor(gpa: number): string {
  if (gpa >= 8) return '#10B981';
  if (gpa >= 6) return '#F59E0B';
  return '#EF4444';
}

const GRADE_ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

// ─── CGPA Line Graph ──────────────────────────────────────────────────────────

function CGPAGraph({ semGPAs }: { semGPAs: { sem: number; gpa: number }[] }) {
  const GRAPH_H = 120;
  const GRAPH_W_ESTIMATE = 280; // used only for connector width calc

  if (semGPAs.length === 0) {
    return (
      <View style={[graphStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={graphStyles.emptyMsg}>No grade data yet</Text>
      </View>
    );
  }

  if (semGPAs.length === 1) {
    return (
      <View style={[graphStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={graphStyles.singleDot} />
        <Text style={graphStyles.singleGPA}>{semGPAs[0].gpa.toFixed(2)}</Text>
        <Text style={graphStyles.singleSem}>Sem {semGPAs[0].sem}</Text>
        <Text style={graphStyles.emptyMsg}>Add more semesters to see your journey</Text>
      </View>
    );
  }

  const maxGPA = 10;
  const pctY = (gpa: number) => 1 - gpa / maxGPA; // 0=top, 1=bottom

  return (
    <View style={graphStyles.container}>
      {/* Y axis labels */}
      <View style={graphStyles.yAxis}>
        {[10, 5, 0].map((v) => (
          <Text key={v} style={graphStyles.yLabel}>{v}</Text>
        ))}
      </View>

      {/* Plot area */}
      <View style={graphStyles.plotArea}>
        {/* Area fill approximation — a single tinted backdrop */}
        <View style={graphStyles.areaFill} />

        {/* Dots + labels */}
        {semGPAs.map((pt, i) => {
          const xPct = semGPAs.length === 1 ? 0.5 : i / (semGPAs.length - 1);
          const yPct = pctY(pt.gpa);
          return (
            <View
              key={pt.sem}
              style={[
                graphStyles.dotWrap,
                {
                  left: `${xPct * 100}%` as any,
                  top: `${yPct * 100}%` as any,
                },
              ]}
            >
              <Text style={graphStyles.dotLabel}>{pt.gpa.toFixed(1)}</Text>
              <View style={graphStyles.dot} />
              <Text style={graphStyles.semLabel}>S{pt.sem}</Text>
            </View>
          );
        })}

        {/* Connectors between dots */}
        {semGPAs.slice(0, -1).map((pt, i) => {
          const next = semGPAs[i + 1];
          const n = semGPAs.length - 1;
          const x1pct = i / n;
          const x2pct = (i + 1) / n;
          const y1pct = pctY(pt.gpa);
          const y2pct = pctY(next.gpa);

          const dx = (x2pct - x1pct) * 100; // percent of plotArea width
          const dy = (y2pct - y1pct) * GRAPH_H;
          const length = Math.sqrt((dx / 100 * GRAPH_W_ESTIMATE) ** 2 + dy ** 2);
          const angle = Math.atan2(dy, (dx / 100) * GRAPH_W_ESTIMATE) * (180 / Math.PI);

          return (
            <View
              key={`line-${i}`}
              style={[
                graphStyles.connector,
                {
                  left: `${x1pct * 100}%` as any,
                  top: `${y1pct * 100}%` as any,
                  width: length,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const graphStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 20,
    height: 180,
    flexDirection: 'row',
  },
  yAxis: { width: 28, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 },
  yLabel: { fontSize: 11, color: '#475569' },
  plotArea: { flex: 1, position: 'relative' },
  areaFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%',
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 8,
  },
  dotWrap: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -5 }, { translateY: -5 }],
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  dotLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: '600', marginBottom: 2 },
  semLabel: { fontSize: 10, color: '#475569', marginTop: 2 },
  connector: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#7C3AED',
    opacity: 0.4,
    transformOrigin: 'left center' as any,
  },
  emptyMsg: { fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 8 },
  singleDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#7C3AED' },
  singleGPA: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  singleSem: { fontSize: 11, color: '#475569' },
});

// ─── Grades Screen ────────────────────────────────────────────────────────────

export default function Grades() {
  const { subjects, currentSemester, getAllSemesters, getSemesterSubjects, getOverallCGPA, calculateGPA } =
    useSubjectsStore();

  const semesters = getAllSemesters().sort((a, b) => a - b);
  const semGPAs = semesters.map((sem) => ({
    sem,
    gpa: calculateGPA(getSemesterSubjects(sem)),
  }));

  const currentSubjects = getSemesterSubjects(currentSemester).filter((s) => s.marks !== undefined);
  const allWithMarks = subjects.filter((s) => s.marks !== undefined);
  const cgpa = getOverallCGPA();
  const totalCredits = allWithMarks.reduce((a, b) => a + b.credits, 0);

  // Grade distribution across all subjects
  const gradeCounts: Record<string, number> = {};
  allWithMarks.forEach((s) => {
    const g = calculateGrade(s.marks!);
    gradeCounts[g] = (gradeCounts[g] ?? 0) + 1;
  });
  const totalSubjectsWithMarks = allWithMarks.length;

  // Best / focus subjects (current semester)
  const sorted = [...currentSubjects].sort((a, b) => (b.marks ?? 0) - (a.marks ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Trend
  const lastTwo = semGPAs.slice(-2);
  let trend = 'Stable';
  let trendIcon = '📊';
  let trendColor = '#F59E0B';
  if (lastTwo.length === 2) {
    if (lastTwo[1].gpa > lastTwo[0].gpa) { trend = 'Improving'; trendIcon = '📈'; trendColor = '#10B981'; }
    else if (lastTwo[1].gpa < lastTwo[0].gpa) { trend = 'Declining'; trendIcon = '📉'; trendColor = '#EF4444'; }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.pageTitle}>Grades</Text>

      {/* ── Section 1: CGPA Journey ── */}
      <Text style={styles.sectionLabel}>CGPA JOURNEY</Text>
      <CGPAGraph semGPAs={semGPAs} />

      {/* ── Section 2: Current semester bar chart ── */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
        SEMESTER {currentSemester} PERFORMANCE
      </Text>
      <View style={styles.barChartContainer}>
        {currentSubjects.length === 0 ? (
          <Text style={styles.emptyText}>No marks recorded for this semester</Text>
        ) : (
          currentSubjects.map((s) => {
            const grade = calculateGrade(s.marks!);
            const color = barColor(s.marks!);
            return (
              <View key={s.id} style={styles.barRow}>
                <Text style={styles.barSubjectName} numberOfLines={1}>
                  {s.name.length > 16 ? s.name.slice(0, 15) + '…' : s.name}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${s.marks}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.barMarks}>{s.marks}</Text>
                <Text style={[styles.barGrade, { color: gradeColor(grade) }]}>{grade}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* ── Section 3: Grade Distribution ── */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>GRADE DISTRIBUTION</Text>
      <View style={styles.card}>
        {/* Stacked bar */}
        <View style={styles.stackedBar}>
          {totalSubjectsWithMarks === 0 ? (
            <View style={[styles.stackedSegment, { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          ) : (
            GRADE_ORDER.filter((g) => gradeCounts[g]).map((g) => (
              <View
                key={g}
                style={[
                  styles.stackedSegment,
                  {
                    flex: gradeCounts[g] / totalSubjectsWithMarks,
                    backgroundColor: gradeColor(g),
                  },
                ]}
              />
            ))
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {GRADE_ORDER.filter((g) => gradeCounts[g]).map((g) => (
            <View key={g} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: gradeColor(g) }]} />
              <Text style={styles.legendText}>{g}  {gradeCounts[g]}</Text>
            </View>
          ))}
        </View>

        {/* Best / focus */}
        <View style={styles.insightRow}>
          {best && (
            <Text style={styles.insightText}>
              🏆 Best: {best.name.slice(0, 14)} ({best.marks})
            </Text>
          )}
          {worst && worst.id !== best?.id && (
            <Text style={styles.insightText}>
              📈 Focus: {worst.name.slice(0, 14)} ({worst.marks})
            </Text>
          )}
        </View>
      </View>

      {/* ── Section 4: Semester Summary table ── */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SEMESTER SUMMARY</Text>
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          {['SEM', 'SUBJECTS', 'CREDITS', 'GPA'].map((col) => (
            <Text key={col} style={styles.tableHeaderCell}>{col}</Text>
          ))}
        </View>

        {/* Rows */}
        {[...semesters].reverse().map((sem) => {
          const semSubs = getSemesterSubjects(sem);
          const semSubs_withMarks = semSubs.filter((s) => s.marks !== undefined);
          const gpa = calculateGPA(semSubs);
          const credits = semSubs_withMarks.reduce((a, b) => a + b.credits, 0);
          const isCurrent = sem === currentSemester;
          return (
            <View
              key={sem}
              style={[styles.tableRow, isCurrent && styles.tableRowCurrent]}
            >
              <Text style={styles.tableCell}>{sem}</Text>
              <Text style={styles.tableCell}>{semSubs.length}</Text>
              <Text style={styles.tableCell}>{credits}</Text>
              <Text style={[styles.tableCell, { color: gpa > 0 ? gpaColor(gpa) : '#475569', fontWeight: '700' }]}>
                {gpa > 0 ? gpa.toFixed(2) : '—'}
              </Text>
            </View>
          );
        })}

        {/* Overall row */}
        {semesters.length > 1 && (
          <View style={[styles.tableRow, styles.tableRowOverall]}>
            <Text style={[styles.tableCell, { color: '#7C3AED', fontWeight: '700' }]}>ALL</Text>
            <Text style={[styles.tableCell, { color: '#7C3AED' }]}>{allWithMarks.length}</Text>
            <Text style={[styles.tableCell, { color: '#7C3AED' }]}>{totalCredits}</Text>
            <Text style={[styles.tableCell, { color: '#7C3AED', fontWeight: '700', fontSize: 14 }]}>
              {cgpa > 0 ? cgpa.toFixed(2) : '—'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Section 5: Quick insights ── */}
      <View style={styles.insightsStrip}>
        <View style={styles.insightCard}>
          <Text style={styles.insightEmoji}>🏆</Text>
          <Text style={styles.insightValue} numberOfLines={1}>
            {best ? (best.name.length > 10 ? best.name.slice(0, 10) + '…' : best.name) : '—'}
          </Text>
          <Text style={[styles.insightSub, { color: '#10B981' }]}>
            {best ? `${best.marks} marks` : 'No data'}
          </Text>
          <Text style={styles.insightLabel}>Highest</Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightEmoji}>📚</Text>
          <Text style={styles.insightValue}>{totalCredits}</Text>
          <Text style={styles.insightSub}>credits</Text>
          <Text style={styles.insightLabel}>Earned</Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightEmoji}>{trendIcon}</Text>
          <Text style={[styles.insightValue, { color: trendColor, fontSize: 13 }]}>{trend}</Text>
          <Text style={styles.insightSub}>vs last sem</Text>
          <Text style={styles.insightLabel}>Trend</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { paddingBottom: 100 },

  pageTitle: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 2,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', padding: 20 },

  // Bar chart
  barChartContainer: { marginHorizontal: 20 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barSubjectName: {
    fontSize: 13,
    color: '#94A3B8',
    width: 110,
    marginRight: 10,
  },
  barTrack: {
    flex: 1,
    height: 28,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: { height: 28, borderRadius: 8 },
  barMarks: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
    marginLeft: 8,
  },
  barGrade: {
    fontSize: 11,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
    marginLeft: 6,
  },

  // Grade distribution
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  stackedSegment: { height: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#94A3B8' },
  insightRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12, gap: 6 },
  insightText: { fontSize: 12, color: '#94A3B8' },

  // Table
  table: {
    marginHorizontal: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 1,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  tableRowCurrent: { backgroundColor: 'rgba(124,58,237,0.06)' },
  tableRowOverall: { backgroundColor: 'rgba(124,58,237,0.08)' },
  tableCell: { flex: 1, fontSize: 13, color: '#FFFFFF' },

  // Insights strip
  insightsStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  insightEmoji: { fontSize: 20, marginBottom: 6 },
  insightValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  insightSub: { fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center' },
  insightLabel: { fontSize: 10, color: '#475569', marginTop: 4, letterSpacing: 1 },
});
