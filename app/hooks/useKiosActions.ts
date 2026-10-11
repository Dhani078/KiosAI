import type { useKiosData } from "./useKiosData";

export function useKiosActions(d: ReturnType<typeof useKiosData>) {
  const { currentUser, setCurrentUser, keys, setShowAuthModal, authMode, authEmail, setAuthEmail, authPassword, setAuthPassword, authName, setAuthName, setAuthError, newKeyName, setNewKeyName, newKeyRateLimit, newKeyAllowedModels, setNewKeyAllowedModels, setGeneratedKey, selectedOrder, setSelectedOrder, setPayingOrder, playgroundKey, setPlaygroundKey, playgroundModel, playgroundPrompt, setPlaygroundResponse, setPlaygroundLoading, orders, fetchUserData, fetchKeys, refreshAll } = d;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
                  identifier: authEmail,
                  password: authPassword,
                  fullName: authName,
                }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Gagal melakukan autentikasi");
        return;
      }
      if (data.user) {
        localStorage.setItem("kiosai_user_id", data.user.id);
        setCurrentUser(data.user);
        setShowAuthModal(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
        await refreshAll();
      }
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kiosai_user_id");
    // Switch to demo user
    fetchUserData();
    fetchKeys();
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const models = newKeyAllowedModels.trim() 
        ? newKeyAllowedModels.split(",").map(m => m.trim()).filter(Boolean)
        : null;

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "usr_kiosai_demo",
          name: newKeyName || "My Key",
          rateLimit: newKeyRateLimit,
          allowedModels: models,
        }),
      });

      const data = await res.json();
      if (data.apiKey) {
        setGeneratedKey(data.apiKey);
        setPlaygroundKey(data.apiKey);
        setNewKeyName("");
        setNewKeyAllowedModels("");
        await fetchKeys();
      }
    } catch (e) {
      alert("Gagal membuat key");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Nonaktifkan API key ini?")) return;
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      await fetchKeys();
    } catch (e) {
      alert("Gagal menghapus key");
    }
  };

  const handleBuyPackage = async (tier: "bronze" | "silver" | "gold") => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id || "usr_kiosai_demo", tier }),
      });
      const data = await res.json();
      if (data.orderId) {
        setSelectedOrder(data);
      }
    } catch (e) {
      alert("Gagal membuat pesanan");
    }
  };

  const handleSimulatePayment = async () => {
    if (!selectedOrder) return;
    setPayingOrder(true);
    try {
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.orderId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedOrder(null);
        await refreshAll();
      }
    } catch (e) {
      alert("Gagal memproses pembayaran");
    } finally {
      setPayingOrder(false);
    }
  };

  const handleRunPlayground = async () => {
    if (!playgroundKey) {
      alert("Masukkan API Key terlebih dahulu.");
      return;
    }

    setPlaygroundLoading(true);
    setPlaygroundResponse("");

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${playgroundKey}`,
        },
        body: JSON.stringify({
          model: playgroundModel,
          messages: [{ role: "user", content: playgroundPrompt }],
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPlaygroundResponse(`Error [${res.status}]: ${err.error?.message || "Unknown error"}`);
        setPlaygroundLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.substring(6));
                const content = parsed.choices?.[0]?.delta?.content || "";
                acc += content;
                setPlaygroundResponse(acc);
              } catch {}
            }
          }
        }
      }

      await refreshAll();
    } catch (e: any) {
      setPlaygroundResponse(`Network error: ${e.message}`);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  return { handleAuthSubmit, handleLogout, handleCreateKey, handleDeleteKey, handleBuyPackage, handleSimulatePayment, handleRunPlayground };
}
