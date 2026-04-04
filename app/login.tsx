import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark */}
        <Text style={styles.wordmark}>GradeMinds</Text>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue</Text>

          {/* Email */}
          <Text style={styles.label}>College Email</Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="you@bmsce.ac.in"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="Enter your password"
            placeholderTextColor="#4B5563"
            secureTextEntry={!showPassword}
          />

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Button */}
        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Sign up */}
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 60,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    marginTop: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heading: {
    fontFamily: 'Georgia',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 28,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  input: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputFocused: {
    borderColor: '#7C3AED',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgot: {
    color: '#7C3AED',
    fontSize: 13,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 12,
  },
  signInBtn: {
    marginTop: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInBtnDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 13,
    marginHorizontal: 12,
  },
  googleBtn: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupPrompt: {
    color: '#64748B',
    fontSize: 14,
  },
  signupLink: {
    color: '#7C3AED',
    fontSize: 14,
  },
});
