import { create } from 'zustand';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  semester: number;
  usn: string;
  section: string;
  dob: string;
  avatar: string;
}

interface ProfileStore {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getInitials: () => string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Nitya Swadi',
  email: 'nitya@bmsce.ac.in',
  phone: '+91 98765 43210',
  college: 'BMS College of Engineering',
  department: 'Computer Science & Engineering',
  semester: 4,
  usn: '1BM22CS000',
  section: 'A',
  dob: '01/01/2004',
  avatar: 'NS',
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  updateProfile: (updates) => set((state) => ({
    profile: { ...state.profile, ...updates },
  })),
  getInitials: () => {
    const name = get().profile.name;
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  },
}));
