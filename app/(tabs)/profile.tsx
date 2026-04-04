import { View, Text, StyleSheet } from 'react-native';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#F8FAFC', fontSize: 24, fontFamily: 'Georgia' },
  sub: { color: '#64748B', fontSize: 14, marginTop: 8 },
});
