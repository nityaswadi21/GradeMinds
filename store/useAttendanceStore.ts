import { create } from 'zustand';

export interface SubjectAttendance {
  id: string;
  subject: string;
  attended: number;
  total: number;
  labAttended: number;
  labTotal: number;
  color: string;
}

interface AttendanceStore {
  subjects: SubjectAttendance[];
  markAttendance: (id: string, type: 'class' | 'lab', present: boolean) => void;
  getOverallAttendance: () => number;
  getOverallLab: () => number;
  getSafeToSkip: (id: string) => number;
}

const INITIAL: SubjectAttendance[] = [
  { id: '1', subject: 'Data Structures', attended: 30, total: 35, labAttended: 10, labTotal: 12, color: '#7C3AED' },
  { id: '2', subject: 'Operating Systems', attended: 28, total: 32, labAttended: 8, labTotal: 10, color: '#3B82F6' },
  { id: '3', subject: 'Mathematics III', attended: 22, total: 30, labAttended: 0, labTotal: 0, color: '#F59E0B' },
  { id: '4', subject: 'Computer Networks', attended: 18, total: 28, labAttended: 6, labTotal: 8, color: '#10B981' },
  { id: '5', subject: 'DBMS', attended: 25, total: 30, labAttended: 9, labTotal: 10, color: '#EC4899' },
];

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  subjects: INITIAL,

  markAttendance: (id, type, present) => set((state) => ({
    subjects: state.subjects.map((s) => {
      if (s.id !== id) return s;
      if (type === 'class') return {
        ...s,
        attended: present ? s.attended + 1 : s.attended,
        total: s.total + 1,
      };
      return {
        ...s,
        labAttended: present ? s.labAttended + 1 : s.labAttended,
        labTotal: s.labTotal + 1,
      };
    }),
  })),

  getOverallAttendance: () => {
    const s = get().subjects;
    const total = s.reduce((a, b) => a + b.total, 0);
    const attended = s.reduce((a, b) => a + b.attended, 0);
    return total === 0 ? 0 : Math.round((attended / total) * 100);
  },

  getOverallLab: () => {
    const s = get().subjects.filter((x) => x.labTotal > 0);
    const total = s.reduce((a, b) => a + b.labTotal, 0);
    const attended = s.reduce((a, b) => a + b.labAttended, 0);
    return total === 0 ? 0 : Math.round((attended / total) * 100);
  },

  getSafeToSkip: (id) => {
    const s = get().subjects.find((x) => x.id === id);
    if (!s) return 0;
    const canSkip = Math.floor((s.attended - 0.75 * s.total) / 0.75);
    return Math.max(0, canSkip);
  },
}));
