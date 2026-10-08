import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import AuthContext from "./auth-context";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/api/auth/me")
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post("/api/auth/signin", credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async (details) => {
    const { data } = await api.post("/api/auth/signup", details);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await api.post("/api/auth/signout");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
