import { useEffect, useState } from 'react';
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
import { useTimetableStore, WeekDay, ClassSlot } from '../store/useTimetableStore';

const DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_HEIGHT = 72;
const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const COLOR_OPTIONS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

type FormState = {
  subject: string;
  professor: string;
  room: string;
  startTime: string;
  endTime: string;
  color: string;
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatCurrentDate(): string {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

function getTodayDay(): WeekDay | null {
  const days: (WeekDay | null)[] = [null, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()] ?? null;
}

function getCurrentTimeOffset(): number {
  const now = new Date();
  const minutesSinceStart = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  return (minutesSinceStart / 60) * HOUR_HEIGHT;
}

export default function Timetable() {
  const router = useRouter();
  const { selectedDay, setSelectedDay, getClassesForDay, addClass, editClass, deleteClass } =
    useTimetableStore();
  const [timeOffset, setTimeOffset] = useState(getCurrentTimeOffset());
  const todayDay = getTodayDay();
  const isToday = selectedDay === todayDay;
  const classes = getClassesForDay(selectedDay);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSlot | null>(null);
  const [form, setForm] = useState<FormState>({
    subject: '', professor: '', room: '', startTime: '', endTime: '', color: '#7C3AED',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTimeOffset(getCurrentTimeOffset()), 60000);
    return () => clearInterval(timer);
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setForm({ subject: '', professor: '', room: '', startTime: '', endTime: '', color: '#7C3AED' });
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (slot: ClassSlot) => {
    setEditingClass(slot);
    setForm({
      subject: slot.subject,
      professor: slot.professor,
      room: slot.room,
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: slot.color,
    });
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.subject.trim() || !form.professor.trim() || !form.room.trim() ||
        !form.startTime.trim() || !form.endTime.trim()) {
      setFormError('Please fill in all fields');
      return;
    }
    if (editingClass) {
      editClass(editingClass.id, { ...form, day: selectedDay });
    } else {
      addClass({ ...form, day: selectedDay });
    }
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingClass) {
      deleteClass(editingClass.id);
      setModalVisible(false);
    }
  };

  // Build class map and occupied hours
  const classMap: Record<string, ClassSlot> = {};
  classes.forEach((c) => { classMap[c.startTime] = c; });

  const occupiedHours = new Set<number>();
  classes.forEach((c) => {
    const start = timeToMinutes(c.startTime) / 60;
    const end = timeToMinutes(c.endTime) / 60;
    for (let h = start + 1; h < end; h++) occupiedHours.add(h);
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timetable</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerDate}>{formatCurrentDate()}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
        style={styles.daySelectorScroll}
      >
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayPill, selectedDay === day && styles.dayPillActive]}
            onPress={() => setSelectedDay(day)}
            activeOpacity={0.75}
          >
            <Text style={[styles.dayPillText, selectedDay === day && styles.dayPillTextActive]}>
              {day}
            </Text>
            {day === todayDay && (
              <View style={[styles.todayDot, selectedDay === day && styles.todayDotActive]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Schedule */}
      <ScrollView style={styles.schedule} showsVerticalScrollIndicator={false}>
        <View style={styles.scheduleInner}>
          {HOURS.map((hour) => {
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            const cls = classMap[hourStr];
            const isOccupied = occupiedHours.has(hour);

            return (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.timeLabel}>{hourStr}</Text>
                <View style={styles.slotArea}>
                  {cls ? (
                    <ClassCard cls={cls} onLongPress={() => openEditModal(cls)} />
                  ) : !isOccupied ? (
                    <View style={styles.emptySlot} />
                  ) : null}
                </View>
              </View>
            );
          })}

          {/* Current time indicator */}
          {isToday && timeOffset > 0 && timeOffset < HOUR_HEIGHT * HOURS.length && (
            <View style={[styles.timeIndicator, { top: timeOffset }]}>
              <View style={styles.timeIndicatorDot} />
              <View style={styles.timeIndicatorLine} />
            </View>
          )}
        </View>

        <Text style={styles.longPressHint}>Long press a class to edit</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.backdropDismiss} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingClass ? 'Edit Class' : 'Add Class'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Fields */}
              <TextInput
                style={styles.input}
                value={form.subject}
                onChangeText={(v) => setForm({ ...form, subject: v })}
                placeholder="e.g. Data Structures"
                placeholderTextColor="#334155"
              />
              <TextInput
                style={styles.input}
                value={form.professor}
                onChangeText={(v) => setForm({ ...form, professor: v })}
                placeholder="e.g. Prof. Sharma"
                placeholderTextColor="#334155"
              />
              <TextInput
                style={styles.input}
                value={form.room}
                onChangeText={(v) => setForm({ ...form, room: v })}
                placeholder="e.g. Room 304"
                placeholderTextColor="#334155"
              />
              <TextInput
                style={styles.input}
                value={form.startTime}
                onChangeText={(v) => setForm({ ...form, startTime: v })}
                placeholder="09:00"
                placeholderTextColor="#334155"
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={styles.input}
                value={form.endTime}
                onChangeText={(v) => setForm({ ...form, endTime: v })}
                placeholder="10:00"
                placeholderTextColor="#334155"
                keyboardType="numbers-and-punctuation"
              />

              {/* Color picker */}
              <Text style={styles.colorLabel}>Color</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((color) => {
                  const isSelected = form.color === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setForm({ ...form, color })}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && styles.colorCircleSelected,
                      ]}
                    />
                  );
                })}
              </View>

              {/* Validation error */}
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              {/* Action buttons */}
              <View style={styles.actionRow}>
                {editingClass && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, !editingClass && styles.saveBtnFull]}
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

function ClassCard({ cls, onLongPress }: { cls: ClassSlot; onLongPress: () => void }) {
  const durationHours = (timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime)) / 60;
  const cardHeight = durationHours * HOUR_HEIGHT - 8;

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.classCard,
          { height: cardHeight, backgroundColor: cls.color + '22', borderLeftColor: cls.color },
        ]}
      >
        <Text style={styles.classSubject} numberOfLines={2}>{cls.subject}</Text>
        <Text style={styles.classDetails}>{cls.professor} · {cls.room}</Text>
        <Text style={[styles.classTime, { color: cls.color }]}>{cls.startTime} – {cls.endTime}</Text>
      </View>
    </TouchableOpacity>
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
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 100,
    justifyContent: 'flex-end',
  },
  headerDate: { fontSize: 13, color: '#64748B' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 20, lineHeight: 32, textAlign: 'center' },

  // Day selector
  daySelectorScroll: { flexGrow: 0, marginBottom: 16 },
  daySelector: { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  dayPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  dayPillActive: { backgroundColor: '#7C3AED' },
  dayPillText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  dayPillTextActive: { color: '#FFFFFF', fontWeight: '600' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7C3AED', marginTop: 3 },
  todayDotActive: { backgroundColor: '#FFFFFF' },

  // Schedule
  schedule: { flex: 1, paddingHorizontal: 20 },
  scheduleInner: { position: 'relative' },
  hourRow: { flexDirection: 'row', height: HOUR_HEIGHT, alignItems: 'flex-start' },
  timeLabel: { width: 48, fontSize: 11, color: '#64748B', paddingTop: 4 },
  slotArea: { flex: 1, paddingLeft: 8 },
  emptySlot: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 4 },
  longPressHint: { fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 8 },

  // Class card
  classCard: { borderLeftWidth: 3, borderRadius: 12, padding: 12, marginBottom: 4 },
  classSubject: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  classDetails: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  classTime: { fontSize: 11, marginTop: 4, fontWeight: '500' },

  // Time indicator
  timeIndicator: {
    position: 'absolute',
    left: 48,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIndicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED', marginLeft: 8 },
  timeIndicatorLine: { flex: 1, height: 1, backgroundColor: '#7C3AED', opacity: 0.6 },

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
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontFamily: 'Georgia', fontSize: 20, color: '#FFFFFF' },
  closeBtn: { fontSize: 24, color: '#64748B', lineHeight: 28 },

  // Form
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
  colorLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  colorCircleSelected: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#FFFFFF' },
  formError: { color: '#EF4444', fontSize: 13, marginBottom: 12 },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12 },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnFull: { flex: 1 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
