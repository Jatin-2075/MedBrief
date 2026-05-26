import { useContext } from "react";
import { HealthDataContext } from "../context/HealthDataContext";

export function useAuth() {
  const context = useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a HealthDataProvider");
  }
  return {
    currentUser: context.currentUser,
    currentProfile: context.currentProfile,
    login: context.login,
    register: context.register,
    logout: context.logout,
    updateProfile: context.updateProfile
  };
}
