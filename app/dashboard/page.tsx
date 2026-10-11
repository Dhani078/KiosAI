import type { Metadata } from "next";
import AuthGuard from "../components/AuthGuard";
import DashboardApp from "./DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard — KiosAI",
  description: "Kelola API key, saldo token, dan statistik pemakaian model AI Anda.",
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardApp />
    </AuthGuard>
  );
}