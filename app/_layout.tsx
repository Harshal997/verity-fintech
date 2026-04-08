import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

function RouteGuard() {
  const { session, setSession, initialized } = useAuthStore();
  console.log("Current session:", session); // Debugging line
  const segments = useSegments();
  const router = useRouter();

  // boot — restore session from SecureStore on app launch
  useEffect(() => {
    // getSession covers the "returning user" case (app restart)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // onAuthStateChange covers signup, signin, signout, token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("auth event:", event, session?.user?.email);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // redirect logic — runs whenever session or route changes
  useEffect(() => {
    if (!initialized) return; // ← wait until session is known
    const inAuthGroup = segments[0] === "(auth)";
    if (!session)
      setTimeout(() => router.replace("/(auth)/signup"), 2200);
    else if (session)
      setTimeout(() => router.replace("/(app)/home"), 2200);
  }, [session, segments, initialized]);

  return <Slot />;
}

export default function RootLayout() {
  return <RouteGuard />;
}
