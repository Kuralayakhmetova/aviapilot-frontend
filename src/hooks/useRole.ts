import { useAuth } from "@/lib/auth-context";

export function useRole() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase(); // ✅ нормализуем к верхнему регистру
  return {
    isAdmin: role === "ADMIN",
    isUser:  role === "USER",
    role:    user?.role ?? null,
  };
}