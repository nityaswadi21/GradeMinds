import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useSubjectsStore } from '../../store/useSubjectsStore';
import { useAttendanceStore } from '../../store/useAttendanceStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Profile() {
  const router = useRouter();
  const { user, avatar, phone, college, branch, semester, usn, logout, updateProfile } =
    useAuthStore();
  const cgpa = useSubjectsStore((s) => s.getOverallCGPA());
  const attendance = useAttendanceStore((s) => s.getOverallAttendance());

  const [editMode, setEditMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formName, setFormName] = useState(user?.name ?? '');
  const [formBranch, setFormBranch] = useState(branch);
  const [formSemester, setFormSemester] = useState(semester > 0 ? String(semester) : '');
  const [formUSN, setFormUSN] = useState(usn);
  const [formPhone, setFormPhone] = useState(phone);
  const [formCollege, setFormCollege] = useState(college);

  // Sync form when store changes
  useEffect(() => {
    setFormName(user?.name ?? '');
    setFormBranch(branch);
    setFormSemester(semester > 0 ? String(semester) : '');
    setFormUSN(usn);
    setFormPhone(phone);
    setFormCollege(college);
  }, [user, branch, semester, usn, phone, college]);

  const handleSave = () => {
    const newName = formName.trim() || (user?.name ?? 'Student');
    const newInitials = newName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    updateProfile({
      user: { ...(user ?? { email: '', college: '' }), name: newName },
      avatar: newInitials,
      college: formCollege.trim(),
      branch: formBranch.trim(),
      semester: parseInt(formSemester, 10) || 0,
      usn: formUSN.trim(),
      phone: formPhone.trim(),
    });
    setEditMode(false);
    setSuccessMsg('Profile updated ✓');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const rows: { icon: IoniconName; label: string; value: string; key: string; editable: boolean }[] =
    [
      { icon: 'school-outline', label: 'College', value: college || 'Not set', key: 'college', editable: true },
      { icon: 'git-branch-outline', label: 'Branch', value: branch || 'Not set', key: 'branch', editable: true },
      { icon: 'calendar-number-outline', label: 'Semester', value: semester > 0 ? `Sem ${semester}` : 'Not set', key: 'semester', editable: true },
      { icon: 'card-outline', label: 'USN', value: usn || 'Not set', key: 'usn', editable: true },
    ];

  const personalRows: { icon: IoniconName; label: string; value: string; key: string; editable: boolean }[] =
    [
      { icon: 'mail-outline', label: 'Email', value: user?.email ?? '', key: 'email', editable: false },
      { icon: 'call-outline', label: 'Phone', value: phone || 'Not set', key: 'phone', editable: true },
    ];

  const getFormValue = (key: string): string => {
    if (key === 'college') return formCollege;
    if (key === 'branch') return formBranch;
    if (key === 'semester') return formSemester;
    if (key === 'usn') return formUSN;
    if (key === 'phone') return formPhone;
    return '';
  };

  const setFormValue = (key: string, value: string) => {
    if (key === 'college') setFormCollege(value);
    else if (key === 'branch') setFormBranch(value);
    else if (key === 'semester') setFormSemester(value);
    else if (key === 'usn') setFormUSN(value);
    else if (key === 'phone') setFormPhone(value);
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
        <Text style={styles.pageTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (editMode) handleSave();
            else setEditMode(true);
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.editToggle}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Success message */}
      {successMsg ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Profile hero */}
      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatar || 'S'}</Text>
          </View>
          {editMode && (
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera-outline" size={14} color="#7C3AED" />
            </View>
          )}
        </View>

        {editMode ? (
          <TextInput
            style={styles.nameInput}
            value={formName}
            onChangeText={setFormName}
            placeholder="Your name"
            placeholderTextColor="#334155"
            autoCapitalize="words"
          />
        ) : (
          <Text style={styles.heroName}>{user?.name ?? 'Student'}</Text>
        )}

        <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
        {usn ? <Text style={styles.heroUSN}>{usn}</Text> : null}
      </View>

      {/* Academic Info */}
      <Text style={styles.sectionLabel}>ACADEMIC INFO</Text>
      <View style={styles.infoCard}>
        {rows.map((row, i) => (
          <View
            key={row.key}
            style={[styles.infoRow, i === rows.length - 1 && styles.infoRowLast]}
          >
            <Ionicons name={row.icon} size={16} color="#64748B" />
            <Text style={styles.infoRowLabel}>{row.label}</Text>
            {editMode && row.editable ? (
              <TextInput
                style={styles.infoInput}
                value={getFormValue(row.key)}
                onChangeText={(v) => setFormValue(row.key, v)}
                placeholder="Enter value"
                placeholderTextColor="#334155"
                keyboardType={row.key === 'semester' ? 'number-pad' : 'default'}
                autoCapitalize={row.key === 'usn' ? 'characters' : 'sentences'}
              />
            ) : (
              <Text style={styles.infoRowValue}>{row.value}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Personal Info */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PERSONAL INFO</Text>
      <View style={styles.infoCard}>
        {personalRows.map((row, i) => (
          <View
            key={row.key}
            style={[styles.infoRow, i === personalRows.length - 1 && styles.infoRowLast]}
          >
            <Ionicons name={row.icon} size={16} color="#64748B" />
            <Text style={styles.infoRowLabel}>{row.label}</Text>
            {editMode && row.editable ? (
              <TextInput
                style={styles.infoInput}
                value={getFormValue(row.key)}
                onChangeText={(v) => setFormValue(row.key, v)}
                placeholder="Enter value"
                placeholderTextColor="#334155"
                keyboardType={row.key === 'phone' ? 'phone-pad' : 'default'}
              />
            ) : (
              <Text style={styles.infoRowValue}>{row.value}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>
            {cgpa > 0 ? cgpa.toFixed(1) : '—'}
          </Text>
          <Text style={styles.statLabel}>CGPA</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{attendance}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>12🔥</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Save button (edit mode only) */}
      {editMode && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { marginTop: editMode ? 12 : 24 }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Bottom note */}
      {!editMode && (
        <Text style={styles.bottomNote}>
          Profile data is stored locally. Backend sync coming soon.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pageTitle: { fontFamily: 'Georgia', fontSize: 26, color: '#FFFFFF' },
  editToggle: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },

  successBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  successText: { color: '#10B981', fontSize: 13, textAlign: 'center' },

  // Hero
  heroCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Georgia', fontSize: 28, color: '#FFFFFF' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#0D0D1A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
  },
  heroName: { fontFamily: 'Georgia', fontSize: 22, color: '#FFFFFF', marginTop: 12 },
  nameInput: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED',
    paddingVertical: 4,
    textAlign: 'center',
    minWidth: 180,
  },
  heroEmail: { fontSize: 13, color: '#64748B', marginTop: 4 },
  heroUSN: { fontSize: 12, color: '#475569', marginTop: 2 },

  // Section label
  sectionLabel: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 2,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  // Info card
  infoCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoRowLabel: { fontSize: 13, color: '#64748B', marginLeft: 10, width: 80 },
  infoRowValue: {
    flex: 1, fontSize: 13, color: '#FFFFFF',
    fontWeight: '500', textAlign: 'right',
  },
  infoInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED',
    paddingVertical: 2,
  },

  // Stats
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { fontFamily: 'Georgia', fontSize: 22 },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },

  // Save
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },

  // Logout
  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },

  // Bottom note
  bottomNote: {
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 100,
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
  },
});
