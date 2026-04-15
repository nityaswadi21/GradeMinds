import { create } from 'zustand';

interface User {
  name: string;
  email: string;
  college: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  avatar: string;
  phone: string;
  college: string;
  branch: string;
  semester: number;
  usn: string;
}

interface AuthActions {
  login: (email: string, password: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<AuthState>) => void;
}

const INITIAL: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  avatar: '',
  phone: '',
  college: '',
  branch: '',
  semester: 0,
  usn: '',
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...INITIAL,

  login: (email) => {
    const namePart = email.split('@')[0] ?? 'Student';
    const name = namePart
      .split('.')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    set({
      isAuthenticated: true,
      token: 'stub-token-' + Date.now(),
      user: { name, email, college: 'BMSCE' },
      avatar: initials,
      phone: '',
      college: 'BMS College of Engineering',
      branch: '',
      semester: 0,
      usn: '',
    });
  },

  logout: () => set(INITIAL),

  updateProfile: (updates) => set((state) => ({ ...state, ...updates })),
}));
