import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTodoStore } from '../../store/useTodoStore';
import { useTimetableStore } from '../../store/useTimetableStore';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useSubjectsStore } from '../../store/useSubjectsStore';
import { useAuthStore } from '../../store/useAuthStore';

const DAYS = [
  { letter: 'M', date: 24, hasClass: true },
  { letter: 'T', date: 25, hasClass: true },
  { letter: 'W', date: 26, hasClass: true, isToday: true },
  { letter: 'T', date: 27, hasClass: true },
  { letter: 'F', date: 28, hasClass: true },
  { letter: 'S', date: 29, hasClass: false },
  { letter: 'S', date: 30, hasClass: false },
];

const QUICK_ACCESS: { icon: string; color: string; label: string }[][] = [
  [
    { icon: 'calendar-outline', color: '#7C3AED', label: 'Timetable' },
    { icon: 'document-text-outline', color: '#3B82F6', label: 'PYQ Bank' },
    { icon: 'stats-chart-outline', color: '#10B981', label: 'Attendance' },
    { icon: 'trending-up-outline', color: '#EC4899', label: 'Grade Graph' },
  ],
];

const CATEGORY_COLORS: Record<string, string> = {
  assignment: '#7C3AED',
  revision: '#3B82F6',
  quiz: '#F59E0B',
  lab: '#10B981',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function Home() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { todos, addTodo, toggleTodo, deleteTodo, cycleCategory, fetchTodos } = useTodoStore();
  const { getCurrentClass } = useTimetableStore();

  useEffect(() => { fetchTodos(); }, []);
  const currentClass = getCurrentClass();
  const { getOverallAttendance } = useAttendanceStore();
  const overallAttendance = getOverallAttendance();
  const avatar = useAuthStore((s) => s.avatar);
  const userName = useAuthStore((s) => s.user?.name ?? 'Student');
  const firstName = userName.split(' ')[0];
  const cgpa = useSubjectsStore((s) => s.getOverallCGPA());
  const subjectCount = useSubjectsStore((s) => s.subjects.filter((x) => x.isCurrentSemester).length);

  const activeTodos = todos
    .filter((t) => !t.completed)
    .sort((a, b) => b.createdAt - a.createdAt);
  const completedTodos = todos.filter((t) => t.completed);

  const handleAdd = () => {
    if (inputText.trim()) {
      addTodo(inputText.trim());
      setInputText('');
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, {firstName} 🌤</Text>
          <Text style={styles.brand}>GradeMinds</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatar || 'S'}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="medal-outline" size={28} color="#F59E0B" style={styles.statIcon} />
          <Text style={styles.statValue}>{cgpa.toFixed(1)}</Text>
          <Text style={styles.statLabel}>CGPA</Text>
        </View>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/subjects')} activeOpacity={0.75}>
          <Ionicons name="book-outline" size={28} color="#10B981" style={styles.statIcon} />
          <Text style={styles.statValue}>{subjectCount}</Text>
          <Text style={styles.statLabel}>SUBJECTS</Text>
        </TouchableOpacity>
        <View style={styles.statCard}>
          <Ionicons name="flash-outline" size={28} color="#7C3AED" style={styles.statIcon} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
      </View>

      {/* Attendance warning */}
      {overallAttendance < 75 && (
        <View style={styles.attendanceWarning}>
          <Text style={styles.attendanceWarningText}>
            ⚠️ Attendance below 75% — check tracker
          </Text>
        </View>
      )}

      {/* Now In Class Card */}
      <View style={styles.card}>
        <View style={styles.nowInClassHeader}>
          <Text style={styles.nowInClassLabel}>NOW IN CLASS</Text>
          {currentClass && (
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>● LIVE</Text>
            </View>
          )}
        </View>
        {currentClass ? (
          <>
            <Text style={styles.subjectName}>{currentClass.subject}</Text>
            <Text style={styles.classDetails}>
              {currentClass.professor} · {currentClass.room} · {currentClass.startTime} – {currentClass.endTime}
            </Text>
            {(() => {
              const now = new Date();
              const nowMins = now.getHours() * 60 + now.getMinutes();
              const startMins = timeToMinutes(currentClass.startTime);
              const endMins = timeToMinutes(currentClass.endTime);
              const total = endMins - startMins;
              const elapsed = nowMins - startMins;
              const pct = Math.min(100, Math.round((elapsed / total) * 100));
              const remaining = endMins - nowMins;
              return (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.timeLabels}>
                    <Text style={styles.timeLabel}>Started {elapsed} min ago</Text>
                    <Text style={styles.timeLabel}>{remaining} min remaining</Text>
                  </View>
                </>
              );
            })()}
          </>
        ) : (
          <Text style={styles.noClassText}>No class right now 🎉</Text>
        )}
      </View>

      {/* This Week Calendar */}
      <View style={styles.card}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonth}>March 2025</Text>
          <View style={styles.calendarNav}>
            <TouchableOpacity>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.daysRow}>
          {DAYS.map((day, i) => (
            <View key={i} style={styles.dayCol}>
              <Text style={styles.dayLetter}>{day.letter}</Text>
              <View style={[styles.dateCircle, day.isToday && styles.dateCircleToday]}>
                <Text style={[styles.dateNum, day.isToday && styles.dateNumToday]}>
                  {day.date}
                </Text>
              </View>
              {day.hasClass ? <View style={styles.classDot} /> : <View style={styles.classDotEmpty} />}
            </View>
          ))}
        </View>
      </View>

      {/* TO-DO SECTION */}
      <View style={styles.todoHeaderRow}>
        <Text style={styles.sectionLabel}>TO-DO</Text>
        <Text style={styles.todoStats}>
          {activeTodos.length} remaining · {completedTodos.length} done
        </Text>
      </View>

      {/* Add Task Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.taskInput, inputFocused && styles.taskInputFocused, { color: '#F8FAFC' }]}
          value={inputText}
          onChangeText={setInputText}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Add a task..."
          placeholderTextColor="#334155"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Active Todos */}
      {activeTodos.length === 0 ? (
        <Text style={styles.emptyState}>Nothing pending. Enjoy the day ✦</Text>
      ) : (
        activeTodos.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo(todo.id)}
            onDelete={() => deleteTodo(todo.id)}
            onCycle={() => cycleCategory(todo.id)}
          />
        ))
      )}

      {/* Completed Section */}
      {completedTodos.length > 0 && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.completedToggle}
            onPress={() => setShowCompleted((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.completedToggleText}>
              Completed ({completedTodos.length}){'  '}{showCompleted ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>
          {showCompleted &&
            completedTodos.map((todo) => (
              <View key={todo.id} style={styles.completedRow}>
                <TodoRow
                  todo={todo}
                  onToggle={() => toggleTodo(todo.id)}
                  onDelete={() => deleteTodo(todo.id)}
                  onCycle={() => cycleCategory(todo.id)}
                />
              </View>
            ))}
        </>
      )}

      {/* Quick Access Grid */}
      <View style={styles.quickAccessSection}>
        <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
        {QUICK_ACCESS.map((row, ri) => (
          <View key={ri} style={styles.quickRow}>
            {row.map((item, ci) => (
              <TouchableOpacity
                key={ci}
                style={styles.quickBtn}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.label === 'Timetable') router.push('/timetable');
                  if (item.label === 'Attendance') router.push('/attendance');
		  if (item.label === 'Grade Graph') router.push('/grades-graph');
                }}
              >
                <Ionicons name={item.icon as any} size={32} color={item.color} />
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

type TodoRowProps = {
  todo: { id: string; text: string; completed: boolean; category: string | null };
  onToggle: () => void;
  onDelete: () => void;
  onCycle: () => void;
};

function TodoRow({ todo, onToggle, onDelete, onCycle }: TodoRowProps) {
  const catColor = todo.category ? CATEGORY_COLORS[todo.category] : null;
  return (
    <View style={todoStyles.row}>
      {/* Checkbox */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={[todoStyles.checkbox, todo.completed && todoStyles.checkboxDone]}>
          {todo.completed && <Text style={todoStyles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Category dot */}
      <TouchableOpacity onPress={onCycle} activeOpacity={0.7}>
        <View
          style={[
            todoStyles.catDot,
            catColor
              ? { backgroundColor: catColor }
              : { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' },
          ]}
        />
      </TouchableOpacity>

      {/* Text */}
      <Text
        style={[
          todoStyles.taskText,
          todo.completed && todoStyles.taskTextDone,
        ]}
        numberOfLines={2}
      >
        {todo.text}
      </Text>

      {/* Delete */}
      <TouchableOpacity onPress={onDelete} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={todoStyles.deleteBtn}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const todoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 6,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#7C3AED',
    borderWidth: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 14,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
  },
  taskTextDone: {
    color: '#475569',
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    fontSize: 18,
    color: '#334155',
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  scroll: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  brand: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'flex-start',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Shared card
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Now In Class
  nowInClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nowInClassLabel: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 2,
  },
  livePill: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  livePillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  subjectName: {
    fontFamily: 'Georgia',
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 8,
  },
  classDetails: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    marginTop: 16,
  },
  progressFill: {
    width: '60%',
    height: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 999,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  noClassText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  attendanceWarning: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 20,
    marginTop: 8,
  },
  attendanceWarningText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
  },

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarMonth: {
    fontFamily: 'Georgia',
    fontSize: 16,
    color: '#FFFFFF',
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 12,
  },
  navArrow: {
    fontSize: 20,
    color: '#64748B',
  },
  daysRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayLetter: {
    fontSize: 11,
    color: '#64748B',
  },
  dateCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleToday: {
    backgroundColor: '#7C3AED',
  },
  dateNum: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  dateNumToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  classDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },
  classDotEmpty: {
    width: 4,
    height: 4,
  },

  // Quick Access
  quickAccessSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },

  // Shared section label
  sectionLabel: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 2,
  },

  // To-Do
  todoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  todoStats: {
    fontSize: 10,
    color: '#64748B',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  taskInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    fontSize: 15,
  },
  taskInputFocused: {
    borderBottomColor: '#7C3AED',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 36,
    textAlign: 'center',
  },
  emptyState: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 20,
    marginVertical: 12,
  },
  completedToggle: {
    marginHorizontal: 20,
    marginBottom: 4,
  },
  completedToggleText: {
    fontSize: 11,
    color: '#475569',
    letterSpacing: 1,
  },
  completedRow: {
    opacity: 0.5,
  },
});
