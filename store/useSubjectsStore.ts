import { create } from 'zustand';

export interface Subject {
  id: string;
  name: string;
  credits: number;
  semester: number;
  marks?: number;
  grade?: string;
  isCurrentSemester: boolean;
}

interface SubjectsStore {
  subjects: Subject[];
  currentSemester: number;
  addSubject: (subject: Omit<Subject, 'id' | 'grade'>) => void;
  editSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  calculateGrade: (marks: number) => string;
  calculateGPA: (subjects: Subject[]) => number;
  getOverallCGPA: () => number;
  getSemesterSubjects: (semester: number) => Subject[];
  getAllSemesters: () => number[];
}

export const calculateGrade = (marks: number): string => {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 55) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 45) return 'P';
  return 'F';
};

const gradeToPoint = (grade: string): number => {
  const map: Record<string, number> = {
    O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0,
  };
  return map[grade] ?? 0;
};

export const calculateGPA = (subjects: Subject[]): number => {
  const withMarks = subjects.filter((s) => s.marks !== undefined);
  if (withMarks.length === 0) return 0;
  const totalCredits = withMarks.reduce((a, b) => a + b.credits, 0);
  const weightedPoints = withMarks.reduce((a, b) => {
    const grade = calculateGrade(b.marks!);
    return a + gradeToPoint(grade) * b.credits;
  }, 0);
  return totalCredits === 0 ? 0 : Math.round((weightedPoints / totalCredits) * 100) / 100;
};

const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'Data Structures', credits: 4, semester: 4, marks: 88, isCurrentSemester: true },
  { id: '2', name: 'Operating Systems', credits: 4, semester: 4, marks: 92, isCurrentSemester: true },
  { id: '3', name: 'Mathematics III', credits: 4, semester: 4, marks: 74, isCurrentSemester: true },
  { id: '4', name: 'Computer Networks', credits: 3, semester: 4, marks: 65, isCurrentSemester: true },
  { id: '5', name: 'DBMS', credits: 4, semester: 4, marks: 80, isCurrentSemester: true },
  { id: '6', name: 'Constitution of India', credits: 1, semester: 4, marks: 85, isCurrentSemester: true },
  { id: '7', name: 'Data Structures Lab', credits: 1, semester: 3, marks: 95, isCurrentSemester: false },
  { id: '8', name: 'Discrete Mathematics', credits: 4, semester: 3, marks: 78, isCurrentSemester: false },
  { id: '9', name: 'Computer Organization', credits: 4, semester: 3, marks: 82, isCurrentSemester: false },
  { id: '10', name: 'OOP with Java', credits: 4, semester: 3, marks: 88, isCurrentSemester: false },
];

export const useSubjectsStore = create<SubjectsStore>((set, get) => ({
  subjects: INITIAL_SUBJECTS,
  currentSemester: 4,

  addSubject: (subject) => set((state) => ({
    subjects: [
      ...state.subjects,
      {
        ...subject,
        id: Date.now().toString(),
        grade: subject.marks !== undefined ? calculateGrade(subject.marks) : undefined,
      },
    ],
  })),

  editSubject: (id, updates) => set((state) => ({
    subjects: state.subjects.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      if (updates.marks !== undefined) updated.grade = calculateGrade(updates.marks);
      return updated;
    }),
  })),

  deleteSubject: (id) => set((state) => ({
    subjects: state.subjects.filter((s) => s.id !== id),
  })),

  calculateGrade,
  calculateGPA,

  getOverallCGPA: () => {
    const all = get().subjects.filter((s) => s.marks !== undefined);
    return calculateGPA(all);
  },

  getSemesterSubjects: (semester) => get().subjects.filter((s) => s.semester === semester),

  getAllSemesters: () => {
    const sems = [...new Set(get().subjects.map((s) => s.semester))];
    return sems.sort((a, b) => b - a);
  },
}));
