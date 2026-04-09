import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useSubjectsStore,
  Subject,
  calculateGrade,
  calculateGPA,
} from '../store/useSubjectsStore';

// ─── Grade helpers ────────────────────────────────────────────────────────────
function gradeBg(grade: string) {
  if (grade === 'O' || grade === 'A+') return 'rgba(16,185,129,0.15)';
  if (grade === 'A' || grade === 'B+') return 'rgba(59,130,246,0.15)';
  if (grade === 'B' || grade === 'C') return 'rgba(245,158,11,0.15)';
  if (grade === 'F') return 'rgba(239,68,68,0.15)';
  return 'rgba(255,255,255,0.06)';
}

function gradeColor(grade: string) {
  if (grade === 'O' || grade === 'A+') return '#10B981';
  if (grade === 'A' || grade === 'B+') return '#3B82F6';
  if (grade === 'B' || grade === 'C') return '#F59E0B';
  if (grade === 'F') return '#EF4444';
  return '#94A3B8';
}

function progressColor(grade: string) {
  return gradeColor(grade);
}

// ─── Form state ───────────────────────────────────────────────────────────────
type FormState = {
  name: string;
  credits: string;
  semester: string;
  marks: string;
  isCurrentSemester: boolean;
};

// ─── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, onLongPress }: { subject: Subject; onLongPress: () => void }) {
  const grade = subject.marks !== undefined ? calculateGrade(subject.marks) : null;
  const pct = subject.marks ?? 0;

  return (
    <TouchableOpacity
      style={styles.subjectCard}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.85}
    >
      <View style={styles.subjectCardTop}>
        <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
        {grade && (
          <View style={[styles.gradeBadge, { backgroundColor: gradeBg(grade) }]}>
            <Text style={[styles.gradeText, { color: gradeColor(grade) }]}>{grade}</Text>
          </View>
        )}
      </View>
      <View style={styles.subjectCardMid}>
        <Text style={styles.creditsText}>{subject.credits} credits</Text>
        {subject.marks !== undefined && (
          <Text style={styles.marksText}>{subject.marks} / 100</Text>
        )}
      </View>
      {subject.marks !== undefined && grade && (
        <View style={styles.subjectProgressTrack}>
          <View
            style={[
              styles.subjectProgressFill,
              { width: `${pct}%`, backgroundColor: progressColor(grade) },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function Subjects() {
  const router = useRouter();
  const {
    subjects,
    currentSemester,
    addSubject,
    editSubject,
    deleteSubject,
    getAllSemesters,
    getSemesterSubjects,
    getOverallCGPA,
  } = useSubjectsStore();

  const semesters = getAllSemesters();
  const [selectedSem, setSelectedSem] = useState(currentSemester);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '', credits: '', semester: String(selectedSem), marks: '', isCurrentSemester: false,
  });
  const [formError, setFormError] = useState('');

  const openAdd = () => {
    setEditingSubject(null);
    setForm({ name: '', credits: '', semester: String(selectedSem), marks: '', isCurrentSemester: selectedSem === currentSemester });
    setFormError('');
    setModalVisible(true);
  };

  const openEdit = (s: Subject) => {
    setEditingSubject(s);
    setForm({
      name: s.name,
      credits: String(s.credits),
      semester: String(s.semester),
      marks: s.marks !== undefined ? String(s.marks) : '',
      isCurrentSemester: s.isCurrentSemester,
    });
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.credits.trim()) {
      setFormError('Subject name and credits are required');
      return;
    }
    const credits = parseInt(form.credits, 10);
    const semester = parseInt(form.semester, 10);
    const marks = form.marks.trim() ? parseInt(form.marks, 10) : undefined;

    if (isNaN(credits) || credits < 1 || credits > 6) {
      setFormError('Credits must be between 1 and 6');
      return;
    }

    if (editingSubject) {
      editSubject(editingSubject.id, {
        name: form.name.trim(),
        credits,
        semester,
        marks,
        isCurrentSemester: form.isCurrentSemester,
      });
    } else {
      addSubject({
        name: form.name.trim(),
        credits,
        semester,
        marks,
        isCurrentSemester: form.isCurrentSemester,
      });
    }
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingSubject) {
      deleteSubject(editingSubject.id);
      setModalVisible(false);
    }
  };

  const semSubjects = getSemesterSubjects(selectedSem);
  const semGPA = calculateGPA(semSubjects);
  const semCredits = semSubjects.reduce((a, b) => a + b.credits, 0);
  const cgpa = getOverallCGPA();
  const totalCredits = subjects.filter((s) => s.marks !== undefined).reduce((a, b) => a + b.credits, 0);

  // Live grade preview while typing marks
  const previewMarks = parseInt(form.marks, 10);
  const previewGrade = !isNaN(previewMarks) && previewMarks >= 0 && previewMarks <= 100
    ? calculateGrade(previewMarks) : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subjects</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Semester tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
      >
        {semesters.map((sem) => (
          <TouchableOpacity
            key={sem}
            style={[styles.tab, selectedSem === sem && styles.tabActive]}
            onPress={() => setSelectedSem(sem)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, selectedSem === sem && styles.tabTextActive]}>
              Sem {sem}
            </Text>
            {sem === currentSemester && (
              <View style={[styles.currentBadge, selectedSem === sem && styles.currentBadgeActive]}>
                <Text style={[styles.currentBadgeText, selectedSem === sem && styles.currentBadgeTextActive]}>
                  Current
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* GPA card */}
        <View style={styles.gpaCard}>
          <View style={styles.gpaLeft}>
            <Text style={styles.gpaLabel}>Semester GPA</Text>
            <Text style={styles.gpaValue}>{semGPA > 0 ? semGPA.toFixed(2) : '—'}</Text>
          </View>
          <View style={styles.gpaMid}>
            <Text style={styles.gpaLabel}>{semSubjects.length} subjects</Text>
            <Text style={styles.gpaSubValue}>{semCredits} credits</Text>
          </View>
        </View>

        {/* Subject list */}
        {semSubjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No subjects added for this semester</Text>
            <Text style={styles.emptySub}>Tap + to add subjects</Text>
          </View>
        ) : (
          semSubjects.map((s) => (
            <SubjectCard key={s.id} subject={s} onLongPress={() => openEdit(s)} />
          ))
        )}

        {/* Overall CGPA card */}
        <View style={styles.cgpaCard}>
          <View style={styles.cgpaRow}>
            <Text style={styles.cgpaLabel}>Overall CGPA</Text>
            <Text style={styles.cgpaValue}>{cgpa > 0 ? cgpa.toFixed(2) : '—'}</Text>
          </View>
          <Text style={styles.cgpaSub}>
            Across {semesters.length} semester{semesters.length !== 1 ? 's' : ''} · {subjects.length} subjects · {totalCredits} total credits
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.backdropDismiss} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingSubject ? 'Edit Subject' : 'Add Subject'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Subject name"
                placeholderTextColor="#334155"
              />
              <TextInput
                style={styles.input}
                value={form.credits}
                onChangeText={(v) => setForm({ ...form, credits: v })}
                placeholder="Credits (1–6)"
                placeholderTextColor="#334155"
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                value={form.semester}
                onChangeText={(v) => setForm({ ...form, semester: v })}
                placeholder="Semester number"
                placeholderTextColor="#334155"
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                value={form.marks}
                onChangeText={(v) => setForm({ ...form, marks: v })}
                placeholder="Marks out of 100 (optional)"
                placeholderTextColor="#334155"
                keyboardType="number-pad"
              />

              {/* Live grade preview */}
              {previewGrade && (
                <View style={[styles.gradePreview, { backgroundColor: gradeBg(previewGrade) }]}>
                  <Text style={[styles.gradePreviewText, { color: gradeColor(previewGrade) }]}>
                    Grade: {previewGrade}
                  </Text>
                </View>
              )}

              {/* Current semester toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setForm({ ...form, isCurrentSemester: !form.isCurrentSemester })}
                activeOpacity={0.75}
              >
                <View style={[styles.checkbox, form.isCurrentSemester && styles.checkboxOn]}>
                  {form.isCurrentSemester && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.toggleLabel}>Current Semester</Text>
              </TouchableOpacity>

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <View style={styles.actionRow}>
                {editingSubject && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, !editingSubject && styles.saveBtnFull]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backArrow: { fontSize: 22, color: '#F8FAFC', width: 32 },
  headerTitle: { fontFamily: 'Georgia', fontSize: 20, color: '#FFFFFF', flex: 1, textAlign: 'center' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 20, lineHeight: 32, textAlign: 'center' },

  // Tabs
  tabsScroll: { flexGrow: 0, marginBottom: 8 },
  tabs: { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  currentBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  currentBadgeText: { fontSize: 9, color: '#7C3AED', fontWeight: '600' },
  currentBadgeTextActive: { color: '#FFFFFF' },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // GPA card
  gpaCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  gpaLeft: { flex: 1 },
  gpaMid: { alignItems: 'flex-end' },
  gpaLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  gpaValue: { fontFamily: 'Georgia', fontSize: 32, color: '#FFFFFF' },
  gpaSubValue: { fontSize: 13, color: '#94A3B8', marginTop: 4 },

  // Subject card
  subjectCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  subjectCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 15, color: '#FFFFFF', fontWeight: '600', flex: 1, marginRight: 8 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText: { fontSize: 13, fontWeight: '700' },
  subjectCardMid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  creditsText: { fontSize: 12, color: '#64748B' },
  marksText: { fontSize: 12, color: '#94A3B8' },
  subjectProgressTrack: {
    height: 3, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 10,
  },
  subjectProgressFill: { height: 3, borderRadius: 999 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, color: '#475569', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#334155' },

  // CGPA card
  cgpaCard: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    marginTop: 8,
  },
  cgpaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cgpaLabel: { fontSize: 12, color: '#64748B' },
  cgpaValue: { fontFamily: 'Georgia', fontSize: 28, color: '#7C3AED' },
  cgpaSub: { fontSize: 12, color: '#64748B' },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: 'Georgia', fontSize: 20, color: '#FFFFFF' },
  closeBtn: { fontSize: 24, color: '#64748B', lineHeight: 28 },
  input: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  gradePreview: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  gradePreviewText: { fontSize: 14, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#7C3AED', borderWidth: 0 },
  checkmark: { color: '#FFFFFF', fontSize: 12 },
  toggleLabel: { fontSize: 14, color: '#94A3B8' },
  formError: { color: '#EF4444', fontSize: 13, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  deleteBtn: {
    flex: 1, backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnFull: { flex: 1 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
