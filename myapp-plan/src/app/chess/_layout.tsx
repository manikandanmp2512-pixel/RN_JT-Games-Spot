import { Stack } from "expo-router";
export default function ChessLayout() { return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}><Stack.Screen name="index" /><Stack.Screen name="cpu" /><Stack.Screen name="online" /><Stack.Screen name="friends" /><Stack.Screen name="rankings" /></Stack>; }
