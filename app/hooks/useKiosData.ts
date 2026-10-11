import { useState, useEffect } from "react";

export function useKiosData() {
  const [activeTab, setActiveTab] = useState<"keys" | "packages" | "playground" | "analytics" | "docs">("keys");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; full_name: string; balance_tokens: number; tier: string } | null>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  // New Key Form State
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [newKeyAllowedModels, setNewKeyAllowedModels] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // QRIS Order State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payingOrder, setPayingOrder] = useState(false);

  // Playground State
  const [playgroundKey, setPlaygroundKey] = useState("");
  const [playgroundModel, setPlaygroundModel] = useState("tokenharbor/deepseek-v4.1-flash:free");
  const [playgroundPrompt, setPlaygroundPrompt] = useState("Halo KiosAI, ceritakan secara singkat apa kelebihanmu!");
  const [playgroundResponse, setPlaygroundResponse] = useState("");
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<{
    summary: { totalRequests: number; totalTokens: number; avgLatencyMs: number };
    perModel: any[];
    recentLogs: any[];
  } | null>(null);

  // Available Models State
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  // Orders History State
  const [orders, setOrders] = useState<any[]>([]);

  // Load saved user from localStorage or fallback to demo
  const getActiveUserId = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kiosai_user_id");
      if (saved) return saved;
    }
    return "usr_kiosai_demo";
  };

  const fetchUserData = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/user?id=${uid}`);
      const data = await res.json();
      if (data.user) setCurrentUser(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKeys = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/keys?userId=${uid}`);
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/analytics?userId=${uid}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/v1/models");
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setAvailableModels(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/orders?userId=${uid}`);
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchKeys(), fetchAnalytics(), fetchModels(), fetchOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    activeTab,
    setActiveTab,
    currentUser,
    setCurrentUser,
    keys,
    setKeys,
    loading,
    setLoading,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    authError,
    setAuthError,
    newKeyName,
    setNewKeyName,
    newKeyRateLimit,
    setNewKeyRateLimit,
    newKeyAllowedModels,
    setNewKeyAllowedModels,
    generatedKey,
    setGeneratedKey,
    copiedKey,
    setCopiedKey,
    selectedOrder,
    setSelectedOrder,
    payingOrder,
    setPayingOrder,
    playgroundKey,
    setPlaygroundKey,
    playgroundModel,
    setPlaygroundModel,
    playgroundPrompt,
    setPlaygroundPrompt,
    playgroundResponse,
    setPlaygroundResponse,
    playgroundLoading,
    setPlaygroundLoading,
    analytics,
    setAnalytics,
    availableModels,
    setAvailableModels,
    orders,
    setOrders,
    getActiveUserId,
    fetchUserData,
    fetchKeys,
    fetchAnalytics,
    fetchModels,
    fetchOrders,
    refreshAll,
  };
}
