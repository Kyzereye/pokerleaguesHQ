import React, { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }, null);
      setAuth(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <PasswordField value={password} onChange={setPassword} placeholder="Password" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, marginBottom: 16 },
  input: { borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 4 },
  error: { color: "red", marginBottom: 8 },
  button: { backgroundColor: "#333", padding: 14, borderRadius: 4, alignItems: "center" },
  buttonText: { color: "#fff" },
});
