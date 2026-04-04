import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GradeMinds</Text>
      <Text style={styles.tagline}>THINK ALIKE</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12101F', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 48, color: '#FFFFFF', fontFamily: 'Georgia', marginBottom: 8 },
  tagline: { fontSize: 11, color: '#94A3B8', letterSpacing: 6, marginBottom: 60 },
  button: { width: '100%', backgroundColor: '#7C3AED', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
