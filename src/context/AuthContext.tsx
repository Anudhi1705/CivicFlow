import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "../types.ts";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth from localStorage on mount
    const savedToken = localStorage.getItem("civicflow_token");
    const savedUser = localStorage.getItem("civicflow_user");

    if (savedToken && savedUser) {
      try {
        setAuthState({
          token: savedToken,
          user: JSON.parse(savedUser)
        });
      } catch (e) {
        localStorage.removeItem("civicflow_token");
        localStorage.removeItem("civicflow_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    localStorage.setItem("civicflow_token", token);
    localStorage.setItem("civicflow_user", JSON.stringify(user));
    setAuthState({ user, token });
  };

  const logout = () => {
    localStorage.removeItem("civicflow_token");
    localStorage.removeItem("civicflow_user");
    setAuthState({ user: null, token: null });
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem("civicflow_user", JSON.stringify(updatedUser));
    setAuthState(prev => ({ ...prev, user: updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ user: authState.user, token: authState.token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
