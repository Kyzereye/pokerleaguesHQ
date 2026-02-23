import React, { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import { api } from "../api/client";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && password === confirm;

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await api("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName: displayName || undefined }) }, null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text>We sent a verification link. After verifying, log in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Display name (optional)" value={displayName} onChangeText={setDisplayName} />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading || !valid}>
        <Text style={styles.buttonText}>Sign up</Text>
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
