import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../auth/context";

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Logged in as {user?.email}</Text>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, marginBottom: 16 },
  button: { backgroundColor: "#333", padding: 14, borderRadius: 4, alignItems: "center" },
  buttonText: { color: "#fff" },
});
