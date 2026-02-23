import React, { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function PasswordField({ value, onChange, placeholder }: Props) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.row}>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} secureTextEntry={!show} />
      <Pressable onPress={() => setShow((s) => !s)}><Text>{show ? "Hide" : "Show"}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, padding: 12, borderRadius: 4 },
});
