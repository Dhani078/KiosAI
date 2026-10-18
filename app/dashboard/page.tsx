import type { Metadata } from "next";
import AuthGuard from "../components/AuthGuard";
import DashboardApp from "./DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard - TokoAI",
  description: "Workspace pengguna TokoAI untuk mengelola API keys, saldo token, dan playground.",
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardApp />
    </AuthGuard>
  );
}