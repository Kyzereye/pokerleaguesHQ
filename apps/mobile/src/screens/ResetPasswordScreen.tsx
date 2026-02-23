import React, { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import { api } from "../api/client";
import PasswordField from "../components/PasswordField";

export default function ResetPasswordScreen({ route }: { route: { params?: { token?: string } } }) {
  const token = route.params?.token ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && password === confirm;

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword: password }) }, null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Text>Missing or invalid reset link.</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Password updated</Text>
        <Text>You can log in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>
      <PasswordField value={password} onChange={setPassword} placeholder="New password" />
      <TextInput style={styles.input} placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading || !valid}>
        <Text style={styles.buttonText}>Reset password</Text>
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
