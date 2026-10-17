import type { Metadata } from "next";
import AuthGuard from "../components/AuthGuard";
import DashboardApp from "./DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard — TokoAI",
  description: "Kelola API key, saldo token, dan eksplorasi model AI Anda.",
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardApp />
    </AuthGuard>
  );
}