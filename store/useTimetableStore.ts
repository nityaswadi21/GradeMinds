import { create } from 'zustand';

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface ClassSlot {
  id: string;
  subject: string;
  professor: string;
  room: string;
  startTime: string;
  endTime: string;
  day: WeekDay;
  color: string;
}

interface TimetableStore {
  classes: ClassSlot[];
  selectedDay: WeekDay;
  setSelectedDay: (day: WeekDay) => void;
  getCurrentClass: () => ClassSlot | null;
  getClassesForDay: (day: WeekDay) => ClassSlot[];
  addClass: (slot: Omit<ClassSlot, 'id'>) => void;
  editClass: (id: string, updates: Partial<ClassSlot>) => void;
  deleteClass: (id: string) => void;
}

const SAMPLE_CLASSES: ClassSlot[] = [
  { id: '1', subject: 'Data Structures & Algorithms', professor: 'Prof. Ravi Kumar', room: 'Room 304', startTime: '09:00', endTime: '10:00', day: 'Mon', color: '#7C3AED' },
  { id: '2', subject: 'Operating Systems', professor: 'Prof. Sharma', room: 'Room 201', startTime: '10:00', endTime: '11:00', day: 'Mon', color: '#3B82F6' },
  { id: '3', subject: 'Mathematics III', professor: 'Prof. Rao', room: 'Room 105', startTime: '11:00', endTime: '12:00', day: 'Mon', color: '#F59E0B' },
  { id: '4', subject: 'Computer Networks', professor: 'Prof. Anjali', room: 'Room 302', startTime: '14:00', endTime: '15:00', day: 'Mon', color: '#10B981' },
  { id: '5', subject: 'Data Structures & Algorithms', professor: 'Prof. Ravi Kumar', room: 'Room 304', startTime: '09:00', endTime: '10:00', day: 'Tue', color: '#7C3AED' },
  { id: '6', subject: 'DBMS', professor: 'Prof. Mehta', room: 'Room 203', startTime: '10:00', endTime: '11:00', day: 'Tue', color: '#EC4899' },
  { id: '7', subject: 'Operating Systems', professor: 'Prof. Sharma', room: 'Room 201', startTime: '14:00', endTime: '15:00', day: 'Tue', color: '#3B82F6' },
  { id: '8', subject: 'Mathematics III', professor: 'Prof. Rao', room: 'Room 105', startTime: '09:00', endTime: '10:00', day: 'Wed', color: '#F59E0B' },
  { id: '9', subject: 'Computer Networks', professor: 'Prof. Anjali', room: 'Room 302', startTime: '10:00', endTime: '11:00', day: 'Wed', color: '#10B981' },
  { id: '10', subject: 'DBMS', professor: 'Prof. Mehta', room: 'Room 203', startTime: '11:00', endTime: '12:00', day: 'Wed', color: '#EC4899' },
  { id: '11', subject: 'Data Structures & Algorithms', professor: 'Prof. Ravi Kumar', room: 'Room 304', startTime: '09:00', endTime: '10:00', day: 'Thu', color: '#7C3AED' },
  { id: '12', subject: 'Mathematics III', professor: 'Prof. Rao', room: 'Room 105', startTime: '11:00', endTime: '12:00', day: 'Thu', color: '#F59E0B' },
  { id: '13', subject: 'Operating Systems', professor: 'Prof. Sharma', room: 'Room 201', startTime: '09:00', endTime: '10:00', day: 'Fri', color: '#3B82F6' },
  { id: '14', subject: 'Computer Networks', professor: 'Prof. Anjali', room: 'Room 302', startTime: '11:00', endTime: '12:00', day: 'Fri', color: '#10B981' },
  { id: '15', subject: 'DBMS Lab', professor: 'Prof. Mehta', room: 'Lab 2', startTime: '14:00', endTime: '16:00', day: 'Fri', color: '#EC4899' },
];

export const useTimetableStore = create<TimetableStore>((set, get) => ({
  classes: SAMPLE_CLASSES,
  selectedDay: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as WeekDay[])[new Date().getDay() - 1] ?? 'Mon',
  setSelectedDay: (day) => set({ selectedDay: day }),
  getCurrentClass: () => {
    const classes = get().classes;
    const now = new Date();
    const days: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayIndex = now.getDay();
    if (dayIndex === 0 || dayIndex === 6) return null;
    const today = days[dayIndex - 1];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return classes.find(
      (c) => c.day === today && c.startTime <= currentTime && c.endTime > currentTime
    ) ?? null;
  },
  getClassesForDay: (day) =>
    get()
      .classes.filter((c) => c.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  addClass: (slot) => set((state) => ({
    classes: [...state.classes, { ...slot, id: Date.now().toString() }],
  })),
  editClass: (id, updates) => set((state) => ({
    classes: state.classes.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  deleteClass: (id) => set((state) => ({
    classes: state.classes.filter((c) => c.id !== id),
  })),
}));
