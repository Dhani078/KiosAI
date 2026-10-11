import { lazy, Suspense, useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  m as motion,
  MotionConfig,
  LazyMotion,
} from "motion/react"
import { Badge, Button, Input, SkeletonRows, TableRow } from "./components/ui"
import {
  demoReply,
  initialOrders,
  models,
  tiers,
  type ChatMessage,
} from "./data"
const StateStudio = lazy(() => import("./components/StateStudio"))
const loadMotionFeatures = () =>
  import("./motion-features").then((module) => module.default)
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  KeyRound,
  BookOpen,
  BarChart3,
  MessageSquare,
  Plus,
  X,
  ShieldCheck,
  Clock3,
  LockKeyhole,
  Send,
  Terminal,
  HelpCircle,
  LogOut,
  Zap,
  CheckCheck,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react"

const packages = [
  {
    name: "Bronze",
    price: "50.000",
    tokens: "100.000",
    multiplier: "1.0",
    desc: "Untuk ide kecil yang mulai tumbuh.",
    models: "3 model AI",
    color: "bronze",
    features: [
      "Model ringan & cepat",
      "Cocok untuk chatbot sederhana",
      "Akses API & Playground",
    ],
  },
  {
    name: "Silver",
    price: "150.000",
    tokens: "500.000",
    multiplier: "2.0",
    desc: "Lebih banyak ruang untuk berkarya.",
    models: "6 model AI",
    color: "silver",
    features: [
      "Semua model Bronze + Silver",
      "Cocok untuk aplikasi & bisnis",
      "Konteks lebih panjang",
    ],
  },
  {
    name: "Gold",
    price: "500.000",
    tokens: "2.000.000",
    multiplier: "4.0",
    desc: "Performa penuh, tanpa kompromi.",
    models: "9 model AI",
    color: "gold",
    features: [
      "Semua model, termasuk flagship",
      "Penalaran & tugas kompleks",
      "Prioritas pemrosesan",
    ],
  },
]
const navigation = [
  { name: "API Keys", short: "Keys", icon: KeyRound },
  { name: "Beli Token", short: "Beli", icon: CreditCard },
  { name: "Playground", short: "Playground", icon: MessageSquare },
  { name: "Statistik", short: "Statistik", icon: BarChart3 },
  { name: "Dokumentasi", short: "Docs", icon: BookOpen },
]
function Logo() {
  return (
    <div className="brand">
      <div className="brand-symbol">
        <span />
        <span />
        <span />
      </div>
      <span>
        Kios<span className="brand-ai">AI</span>
      </span>
    </div>
  )
}
function App() {
  const [page, setPage] = useState("Beli Token")
  const [selected, setSelected] = useState(1)
  const [modal, setModal] =
    useState<"payment" | "login" | "key" | "revoke" | null>(null)
  const [toast, setToast] = useState("")
  const [payment, setPayment] = useState(false)
  const [paid, setPaid] = useState(false)
  const [activeTier, setActiveTier] = useState(0)
  const [orders, setOrders] = useState(initialOrders)
  const [countdown, setCountdown] = useState(899)
  const [balance, setBalance] = useState(124580)
  const [keys, setKeys] = useState([
    {
      name: "Project utama",
      key: "kios-demo-not-a-real-secret-a3f",
      date: "18 Jun 2025",
    },
  ])
  const [keyName, setKeyName] = useState("")
  const [loginError, setLoginError] = useState(false)
  const [model, setModel] = useState("GPT-4o mini")
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replying, setReplying] = useState(false)
  const [codeTab, setCodeTab] = useState("cURL")
  const [faq, setFaq] = useState<number | null>(null)
  const [retryAfter, setRetryAfter] = useState(0)
  const [forceLocked, setForceLocked] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [revokeKey, setRevokeKey] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState("")
  const [usage, setUsage] = useState<Record<string, number>>({
    "GPT-4o mini": 48268,
    "Gemini 2.0 Flash": 22626,
    "Llama 3.3 70B": 4526,
  })
  const [requests, setRequests] = useState(1284)
  const selectedModel = models.find((m) => m.name === model) ?? models[0]
  const multiplier = 2 ** selectedModel.tier
  const modelLocked = forceLocked || selectedModel.tier > activeTier
  const totalUsage = Object.values(usage).reduce((sum, count) => sum + count, 0)
  const modalRef = useRef<HTMLElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paymentApplied = useRef(false)
  const paymentDeadline = useRef(Date.now() + 899000)
  const pendingReply = useRef(false)
  const notify = (text: string) => setToast(text)
  const closeModal = () => {
    setModal(null)
    setNewSecret("")
    setLoginError(false)
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(""), 3500)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (modal !== "payment" || paid) return
    const update = () =>
      setCountdown(
        Math.max(0, Math.ceil((paymentDeadline.current - Date.now()) / 1000)),
      )
    const t = setInterval(update, 1000)
    document.addEventListener("visibilitychange", update)
    return () => {
      clearInterval(t)
      document.removeEventListener("visibilitychange", update)
    }
  }, [modal, paid])
  useEffect(() => {
    if (!modal) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const background = document.querySelectorAll<HTMLElement>(
      ".sidebar, .main-shell, .bottom-nav",
    )
    background.forEach((el) => {
      el.inert = true
    })
    const frame = requestAnimationFrame(() => {
      const dialog = modalRef.current
      const target =
        dialog?.querySelector<HTMLElement>("input") ??
        dialog?.querySelector<HTMLElement>("button")
      target?.focus()
    })
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        closeModal()
      }
      if (e.key !== "Tab") return
      const nodes = [
        ...(modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
        ) ?? []),
      ].filter((el) => el.getClientRects().length > 0)
      const first = nodes[0],
        last = nodes[nodes.length - 1]
      if (!first) {
        e.preventDefault()
        modalRef.current?.focus()
        return
      }
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !modalRef.current?.contains(document.activeElement))
      ) {
        e.preventDefault()
        last.focus()
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !modalRef.current?.contains(document.activeElement))
      ) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", fn)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", fn)
      background.forEach((el) => {
        el.inert = false
      })
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
      else document.getElementById("main-content")?.focus()
    }
  }, [modal])
  useEffect(() => {
    if (!modal || (!newSecret && !paid)) return
    const frame = requestAnimationFrame(() =>
      modalRef.current?.querySelector<HTMLElement>("button")?.focus(),
    )
    return () => cancelAnimationFrame(frame)
  }, [newSecret, paid, modal])
  useEffect(() => {
    if (retryAfter <= 0) return
    const timer = setTimeout(
      () => setRetryAfter((s) => Math.max(0, s - 1)),
      1000,
    )
    return () => clearTimeout(timer)
  }, [retryAfter])
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "instant",
    })
  }, [messages, replying])
  useEffect(() => {
    document.documentElement.lang = "id"
    document.title = `KiosAI — ${page}`
    window.scrollTo({ top: 0, behavior: "instant" })
    if (page !== "Playground" && replyTimer.current) {
      clearTimeout(replyTimer.current)
      pendingReply.current = false
      setReplying(false)
    }
  }, [page])
  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current)
      if (keyTimer.current) clearTimeout(keyTimer.current)
    },
    [],
  )
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify("Berhasil disalin ke clipboard")
    } catch {
      notify("Clipboard tidak tersedia di browser ini")
    }
  }
  const buy = (i: number) => {
    setSelected(i)
    paymentDeadline.current = Date.now() + 899000
    setCountdown(899)
    setPayment(false)
    setPaid(false)
    paymentApplied.current = false
    setModal("payment")
  }
  const completePayment = () => {
    if (paymentApplied.current || countdown === 0) return
    if (Date.now() >= paymentDeadline.current) {
      setCountdown(0)
      notify("Pembayaran sudah kedaluwarsa. Buat pembayaran baru.")
      return
    }
    paymentApplied.current = true
    const purchased = packages[selected]
    setBalance((b) => b + Number(purchased.tokens.split(".").join("")))
    setActiveTier((t) => Math.max(t, selected))
    setForceLocked(false)
    setOrders((o) => [
      {
        id: `INV-DEMO-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        tier: purchased.name,
        price: purchased.price,
      },
      ...o,
    ])
    setPaid(true)
    notify("Pembayaran demo berhasil. Token sudah masuk!")
  }
  const resetChat = () => {
    if (replyTimer.current) clearTimeout(replyTimer.current)
    pendingReply.current = false
    setReplying(false)
    setMessages([])
  }
  const scenario = (id: string) => {
    if (id === "login") {
      setLoginError(false)
      setModal("login")
    }
    if (id === "rate") {
      setPage("Playground")
      setForceLocked(false)
      setModel("GPT-4o mini")
      setRetryAfter(30)
    }
    if (id === "locked") {
      setPage("Playground")
      setModel("Claude 3.5 Sonnet")
      setForceLocked(true)
    }
    if (id === "low") {
      setBalance(15000)
      setPage("Statistik")
      notify("Saldo demo diatur menjadi 15.000 token")
    }
    if (id === "purchase") buy(1)
    if (id === "expired") {
      buy(1)
      paymentDeadline.current = 0
      setCountdown(0)
    }
    if (id === "loading") {
      setPage("API Keys")
      setLoadingKeys(true)
      if (keyTimer.current) clearTimeout(keyTimer.current)
      keyTimer.current = setTimeout(() => setLoadingKeys(false), 3000)
    }
    if (id === "empty") {
      setKeys([])
      setPage("API Keys")
      notify("Daftar API key demo dikosongkan")
    }
    if (id === "reset") {
      resetChat()
      setBalance(124580)
      setActiveTier(0)
      setOrders(initialOrders)
      setRetryAfter(0)
      setForceLocked(false)
      setModel("GPT-4o mini")
      setKeys([
        {
          name: "Project utama",
          key: "kios-demo-not-a-real-secret-a3f",
          date: "18 Jun 2025",
        },
      ])
      setUsage({
        "GPT-4o mini": 48268,
        "Gemini 2.0 Flash": 22626,
        "Llama 3.3 70B": 4526,
      })
      setRequests(1284)
      setPrompt("")
      setLoadingKeys(false)
      if (keyTimer.current) clearTimeout(keyTimer.current)
      notify("Seluruh data demo dikembalikan ke kondisi awal")
    }
  }
  const send = () => {
    if (!prompt.trim() || pendingReply.current || retryAfter > 0 || modelLocked)
      return
    const cost = 128 * multiplier
    if (balance < cost) {
      notify("Saldo tidak cukup. Isi token untuk melanjutkan.")
      return
    }
    const text = prompt.trim()
    pendingReply.current = true
    setMessages((m) => [...m, { text, user: true }])
    setPrompt("")
    setReplying(true)
    replyTimer.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          text: demoReply(text),
          user: false,
          model,
          cost,
          multiplier,
        },
      ])
      setReplying(false)
      pendingReply.current = false
      setBalance((b) => Math.max(0, b - cost))
      setUsage((u) => ({ ...u, [model]: (u[model] ?? 0) + cost }))
      setRequests((r) => r + 1)
    }, 1200)
  }
  const code =
    codeTab === "cURL"
      ? `curl https://api.kios.ai/v1/chat/completions \\\n  -H "Authorization: Bearer kios-YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "gpt-4o-mini",\n    "messages": [{"role": "user", "content": "Halo!"}]\n  }'`
      : codeTab === "Python"
        ? `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="kios-YOUR_API_KEY",\n    base_url="https://api.kios.ai/v1"\n)\nresponse = client.chat.completions.create(\n    model="gpt-4o-mini",\n    messages=[{"role": "user", "content": "Halo!"}]\n)\nprint(response.choices[0].message.content)`
        : `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "kios-YOUR_API_KEY",\n  baseURL: "https://api.kios.ai/v1"\n});\nconst response = await client.chat.completions.create({\n  model: "gpt-4o-mini",\n  messages: [{ role: "user", content: "Halo!" }]\n});`
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <div className="app-shell">
          <a href="#main-content" className="skip-link">
            Langsung ke konten
          </a>
          <aside className="sidebar">
            <Logo />
            <div className="workspace">
              <div className="workspace-avatar">R</div>
              <div>
                <strong>Ruang kerja pribadi</strong>
                <small>Akun personal</small>
              </div>
              <ChevronDown size={15} />
            </div>
            <div className="nav-label">WORKSPACE</div>
            <nav aria-label="Navigasi workspace">
              {navigation.map((n) => (
                <button
                  key={n.name}
                  aria-label={n.name}
                  aria-current={page === n.name ? "page" : undefined}
                  className={`nav-item ${page === n.name ? "active" : ""}`}
                  onClick={() => setPage(n.name)}
                >
                  <n.icon size={19} />
                  <span>{n.name}</span>
                  {n.name === "Beli Token" && (
                    <span className="nav-new">TOP UP</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="help-box">
                <div className="help-title">
                  <Terminal size={18} />
                  Dibuat untuk developer.
                </div>
                <p>Satu API. Banyak kemungkinan.</p>
                <button onClick={() => setPage("Dokumentasi")}>
                  Mulai integrasi <ArrowUpRight size={15} />
                </button>
              </div>
              <button
                className="support-link"
                onClick={() => {
                  setPage("Dokumentasi")
                  notify("Bantuan tersedia di panduan integrasi")
                }}
              >
                <HelpCircle size={18} />
                Pusat bantuan
                <ArrowUpRight size={14} />
              </button>
              <button className="profile" onClick={() => setModal("login")}>
                <div className="avatar">RA</div>
                <div>
                  <strong>Rizky Aditya</strong>
                  <small>rizky@email.com</small>
                </div>
                <LogOut size={16} />
              </button>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="breadcrumb">
                Workspace <ChevronRight size={14} />
                <span>{page}</span>
              </div>
              <div className="mobile-brand">
                <Logo />
              </div>
              <div className="topbar-right">
                <span className="status-dot" />
                <button
                  className="demo-indicator"
                  onClick={() => setPage("Komponen & States")}
                >
                  Mode demo <ChevronRight size={12} />
                </button>
                <span className="top-divider" />
                <button
                  className="small-avatar"
                  aria-label="Buka login demo"
                  onClick={() => setModal("login")}
                >
                  RA
                </button>
              </div>
            </header>
            <main id="main-content" tabIndex={-1}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 9 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        {page === "Beli Token"
                          ? "SEDIKIT TOKEN, BANYAK KEMUNGKINAN"
                          : "WORKSPACE / " + page.toUpperCase()}
                      </div>
                      <h1>
                        {page === "Beli Token"
                          ? "Ide besar, mulai dari sini."
                          : page}
                      </h1>
                      <p>
                        {
                          ({
                            "Beli Token":
                              "Isi token, pilih model, dan bangun sesuatu yang berarti.",
                            "API Keys":
                              "Satu kunci untuk menghubungkan semua model AI.",
                            Playground:
                              "Uji ide dan model Anda, langsung di sini.",
                            Statistik:
                              "Semua penggunaan dan transaksi, dalam satu tampilan.",
                            Dokumentasi:
                              "Dari baris kode pertama hingga aplikasi Anda berjalan.",
                            "Komponen & States":
                              "Komponen konsisten. Setiap state bisa dicoba, bukan hanya dilihat.",
                          } as Record<string, string>)[page]
                        }
                      </p>
                    </div>
                    <div className="heading-note">
                      <ShieldCheck size={16} />
                      Tanpa langganan. Tanpa komitmen.
                    </div>
                  </div>
                  {page === "Beli Token" && (
                    <>
                      <section className="balance-strip">
                        <div className="balance-main">
                          <div className="balance-icon">
                            <Zap size={20} />
                          </div>
                          <div>
                            <span className="small-label">
                              Saldo token Anda
                            </span>
                            <div className="balance-number">
                              {balance.toLocaleString("id-ID")}{" "}
                              <span>token</span>
                            </div>
                          </div>
                        </div>
                        <div className="balance-detail">
                          <span className="small-label">Tier aktif</span>
                          <Badge tier={tiers[activeTier]} />
                        </div>
                        <div className="balance-detail expiration">
                          <span className="small-label">
                            Masa berlaku token
                          </span>
                          <span className="expiry">
                            <Clock3 size={14} />
                            Tidak kedaluwarsa
                          </span>
                        </div>
                        <button
                          className="text-link balance-link"
                          onClick={() => setPage("Statistik")}
                        >
                          Lihat penggunaan <ArrowUpRight size={16} />
                        </button>
                      </section>
                      <div className="section-heading">
                        <h2>Pilih paket Anda</h2>
                        <span>Bayar sekali. Pakai kapan saja.</span>
                      </div>
                      <div className="packages">
                        {packages.map((p, i) => (
                          <motion.article
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            key={p.name}
                            className={`package-card ${
                              selected === i ? "selected" : ""
                            }`}
                            onClick={() => setSelected(i)}
                          >
                            <div className="package-top">
                              <Badge tier={p.name} />
                              {i === 1 && (
                                <span className="popular">PALING POPULER</span>
                              )}
                            </div>
                            <p className="package-desc">{p.desc}</p>
                            <div className="price">
                              <span>Rp</span> {p.price}
                            </div>
                            <div className="one-time">sekali bayar</div>
                            <div className="token-box">
                              <div>
                                <span className="small-label">
                                  Token yang didapat
                                </span>
                                <div className="token-number">
                                  {p.tokens}
                                  <span>token</span>
                                </div>
                              </div>
                              <span className="multiplier">
                                {p.multiplier}×
                              </span>
                            </div>
                            <ul className="package-features">
                              {p.features.map((f) => (
                                <li key={f}>
                                  <Check size={15} />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            <Button
                              kind={selected === i ? "primary" : "secondary"}
                              onClick={() => buy(i)}
                            >
                              Beli {p.name}
                              <ArrowRight size={16} />
                            </Button>
                            <div className="package-foot">
                              <CreditCard size={13} />
                              Bayar dengan QRIS
                            </div>
                          </motion.article>
                        ))}
                      </div>
                      <div className="purchase-note">
                        <ShieldCheck size={15} />
                        <span>Pembayaran aman via QRIS</span>
                        <span className="note-dot">·</span>
                        <span>Token langsung masuk setelah pembayaran</span>
                        <span className="note-dot">·</span>
                        <span>Harga sudah termasuk pajak</span>
                      </div>
                      <section className="comparison">
                        <div className="section-heading">
                          <div>
                            <h2>Model yang bisa Anda akses</h2>
                            <p>Model tepat untuk setiap kebutuhan.</p>
                          </div>
                          <button
                            className="text-link"
                            onClick={() => setPage("Dokumentasi")}
                          >
                            Lihat dokumentasi <ArrowUpRight size={15} />
                          </button>
                        </div>
                        <div
                          className="table-scroll"
                          tabIndex={0}
                          role="region"
                          aria-label="Perbandingan model"
                        >
                          <table>
                            <thead>
                              <tr>
                                <th>MODEL</th>
                                <th>COCOK UNTUK</th>
                                <th>BRONZE</th>
                                <th>SILVER</th>
                                <th>GOLD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                {
                                  name: "GPT-4o mini",
                                  sub: "OpenAI",
                                  use: "Chatbot & tugas sehari-hari",
                                  tier: 0,
                                },
                                {
                                  name: "Gemini 2.0 Flash",
                                  sub: "Google",
                                  use: "Respons cepat & multimodal",
                                  tier: 0,
                                },
                                {
                                  name: "Claude 3.5 Sonnet",
                                  sub: "Anthropic",
                                  use: "Coding & analisis mendalam",
                                  tier: 1,
                                },
                                {
                                  name: "GPT-4o",
                                  sub: "OpenAI",
                                  use: "Penalaran & tugas kompleks",
                                  tier: 1,
                                },
                                {
                                  name: "Claude 3.7 Sonnet",
                                  sub: "Anthropic",
                                  use: "Penalaran tingkat lanjut",
                                  tier: 2,
                                },
                              ].map((m, i) => (
                                <tr key={m.name}>
                                  <td>
                                    <div className="model-cell">
                                      <span className={`model-logo logo-${i}`}>
                                        {i === 1 ? (
                                          <Zap size={17} />
                                        ) : i === 2 || i === 4 ? (
                                          "A"
                                        ) : (
                                          <span className="openai-mark">◎</span>
                                        )}
                                      </span>
                                      <div>
                                        <strong>{m.name}</strong>
                                        <small>{m.sub}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="muted">{m.use}</td>
                                  {[0, 1, 2].map((t) => (
                                    <td className="check-cell" key={t}>
                                      {t >= m.tier ? (
                                        <Check size={17} />
                                      ) : (
                                        <span className="dash">—</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="table-note">
                          Dan model lainnya. Semua model tersedia melalui satu
                          API yang kompatibel dengan OpenAI.
                          <span>
                            9 model tersedia <ArrowUpRight size={14} />
                          </span>
                        </div>
                      </section>
                      <div className="lower-grid">
                        <section className="how-section">
                          <div className="section-heading">
                            <h2>Dari bayar ke berkarya.</h2>
                            <span>Hanya 3 langkah</span>
                          </div>
                          <div className="steps">
                            {[
                              {
                                title: "Pilih & bayar",
                                text: "Pilih paket, lalu scan QRIS dari e-wallet atau mobile banking Anda.",
                              },
                              {
                                title: "Buat API key",
                                text: "Token masuk otomatis. Buat kunci API di halaman API Keys.",
                              },
                              {
                                title: "Mulai membangun",
                                text: "Hubungkan ke aplikasi Anda, atau coba dulu di Playground.",
                              },
                            ].map((s, i) => (
                              <div className="step" key={s.title}>
                                <span className="step-number">0{i + 1}</span>
                                <div>
                                  <h3>{s.title}</h3>
                                  <p>{s.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                        <section className="questions">
                          <h2>Sebelum Anda mulai</h2>
                          {[
                            "Apakah token memiliki masa berlaku?",
                            "Bagaimana multiplier token bekerja?",
                            "Bisa upgrade tier kapan saja?",
                          ].map((q, i) => (
                            <div className="faq-item" key={q}>
                              <button
                                aria-expanded={faq === i}
                                aria-controls={`faq-${i}`}
                                onClick={() => setFaq(faq === i ? null : i)}
                              >
                                {q}
                                <Plus
                                  size={16}
                                  className={faq === i ? "rotated" : ""}
                                />
                              </button>
                              {faq === i && (
                                <p id={`faq-${i}`}>
                                  {
                                    [
                                      "Tidak. Token Anda tidak kedaluwarsa dan bisa digunakan kapan saja.",
                                      "Model Silver menggunakan 2× token dan model Gold 4× token dari jumlah penggunaan dasar.",
                                      "Ya. Beli paket tier lebih tinggi untuk membuka akses model tambahan.",
                                    ][i]
                                  }
                                </p>
                              )}
                            </div>
                          ))}
                        </section>
                      </div>
                    </>
                  )}
                  {page === "API Keys" && (
                    <>
                      <div className="content-toolbar">
                        <span>
                          API KEY ANDA{" "}
                          <span className="count-tag">{keys.length}</span>
                        </span>
                        <Button kind="primary" onClick={() => setModal("key")}>
                          <Plus size={16} />
                          Buat API key
                        </Button>
                      </div>
                      <section className="panel">
                        <div className="info-line">
                          <ShieldCheck size={18} />
                          Jaga kerahasiaan API key Anda. Jangan bagikan di kode
                          publik.
                        </div>
                        {loadingKeys ? (
                          <SkeletonRows rows={4} />
                        ) : keys.length ? (
                          <div
                            className="table-scroll"
                            tabIndex={0}
                            role="region"
                            aria-label="Daftar API key"
                          >
                            <table>
                              <thead>
                                <tr>
                                  <th>NAMA</th>
                                  <th>API KEY</th>
                                  <th>DIBUAT</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {keys.map((k) => (
                                  <TableRow key={k.key}>
                                    <td>{k.name}</td>
                                    <td>
                                      <code>
                                        kios-••••••••{k.key.slice(-3)}
                                      </code>
                                    </td>
                                    <td className="muted">{k.date}</td>
                                    <td>
                                      <div className="row-actions">
                                        <Button
                                          kind="ghost"
                                          onClick={() => copy(k.key)}
                                        >
                                          <Copy size={16} />
                                          <span>Salin</span>
                                        </Button>
                                        <Button
                                          kind="ghost"
                                          aria-label={`Cabut API key ${k.name}`}
                                          onClick={() => {
                                            setRevokeKey(k.key)
                                            setModal("revoke")
                                          }}
                                        >
                                          <X size={16} />
                                        </Button>
                                      </div>
                                    </td>
                                  </TableRow>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-state">
                            <KeyRound size={32} />
                            <h2>Belum ada API key.</h2>
                            <p>
                              Buat kunci pertama untuk menghubungkan aplikasi
                              Anda.
                            </p>
                            <Button
                              kind="primary"
                              onClick={() => setModal("key")}
                            >
                              Buat API key
                            </Button>
                          </div>
                        )}
                      </section>
                      <div className="integration-callout">
                        <Terminal size={24} />
                        <div>
                          <h3>Sudah punya aplikasi berbasis OpenAI?</h3>
                          <p>
                            Cukup ubah base URL dan API key. Integrasi Anda
                            tetap sama.
                          </p>
                        </div>
                        <Button onClick={() => setPage("Dokumentasi")}>
                          Lihat panduan
                          <ArrowUpRight size={16} />
                        </Button>
                      </div>
                    </>
                  )}
                  {page === "Playground" && (
                    <section className="panel playground">
                      <div className="playground-toolbar">
                        <div>
                          <label htmlFor="model">MODEL</label>
                          <select
                            id="model"
                            value={model}
                            onChange={(e) => {
                              resetChat()
                              setForceLocked(false)
                              setModel(e.target.value)
                            }}
                          >
                            {models.map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name} [{tiers[m.tier].toUpperCase()}]
                                {m.tier > activeTier ? " — terkunci" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Badge tier={tiers[selectedModel.tier]} />
                        <Button kind="ghost" onClick={resetChat}>
                          Chat baru
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="playground-context">
                        <span>Respons lokal · bukan AI sungguhan</span>
                        <code>
                          Saldo {balance.toLocaleString("id-ID")} ·{" "}
                          {multiplier.toFixed(1)}×
                        </code>
                      </div>
                      {modelLocked ? (
                        <div className="empty-state">
                          <LockKeyhole size={32} />
                          <h2>Model ini belum terbuka.</h2>
                          <p>
                            403 · tier_restricted — Upgrade untuk mengakses{" "}
                            {model}.
                          </p>
                          <Button
                            kind="primary"
                            onClick={() => setPage("Beli Token")}
                          >
                            Upgrade ke {tiers[selectedModel.tier]}
                            <ArrowRight size={16} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {retryAfter > 0 && (
                            <div
                              role="alert"
                              className="warning-banner rate-banner"
                            >
                              <AlertTriangle size={18} />
                              <div>
                                <strong>429 · rate_limit_exceeded</strong>
                                <p>
                                  Terlalu banyak permintaan. Retry-After:{" "}
                                  <code>{retryAfter} detik</code>.
                                </p>
                              </div>
                            </div>
                          )}
                          {balance < 128 * multiplier && (
                            <div
                              role="alert"
                              className="warning-banner rate-banner"
                            >
                              <AlertTriangle size={18} />
                              <span>
                                Saldo tidak cukup untuk respons berikutnya.
                              </span>
                              <Button onClick={() => setPage("Beli Token")}>
                                Isi token
                              </Button>
                            </div>
                          )}
                          <div
                            className="chat-area"
                            ref={chatRef}
                            role="log"
                            aria-label="Percakapan demo"
                            aria-live="polite"
                            aria-busy={replying}
                          >
                            {messages.length === 0 ? (
                              <div className="chat-empty">
                                <div className="chat-logo">
                                  <Terminal size={28} />
                                </div>
                                <h2>Apa yang ingin Anda buat?</h2>
                                <p>
                                  Uji prompt, jelajahi ide, dan temukan model
                                  yang tepat.
                                </p>
                                <div className="prompt-suggestions">
                                  {[
                                    "Buat ide konten untuk bisnis saya",
                                    "Bantu menulis fungsi Python",
                                    "Jelaskan cara kerja API",
                                  ].map((p) => (
                                    <button
                                      onClick={() => setPrompt(p)}
                                      key={p}
                                    >
                                      {p}
                                      <ArrowUpRight size={14} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              messages.map((m, i) => (
                                <div
                                  key={i}
                                  className={`message ${m.user ? "user" : ""}`}
                                >
                                  <span className="message-label">
                                    {m.user ? "ANDA" : m.model?.toUpperCase()}
                                  </span>
                                  <p>{m.text}</p>
                                  {!m.user && (
                                    <small>
                                      {m.cost} token · multiplier{" "}
                                      {m.multiplier?.toFixed(1)}×
                                    </small>
                                  )}
                                </div>
                              ))
                            )}
                            {replying && (
                              <div className="skeleton-message">
                                <span />
                                <span />
                                <span />
                              </div>
                            )}
                          </div>
                          <form
                            className="chat-input"
                            onSubmit={(e) => {
                              e.preventDefault()
                              send()
                            }}
                          >
                            <textarea
                              aria-label="Prompt"
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder="Tulis pesan Anda di sini..."
                              maxLength={4000}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  !e.shiftKey &&
                                  !e.nativeEvent.isComposing
                                ) {
                                  e.preventDefault()
                                  send()
                                }
                              }}
                            />
                            <Button
                              type="submit"
                              kind="primary"
                              aria-label="Kirim pesan"
                              loading={replying}
                              disabled={
                                !prompt.trim() ||
                                retryAfter > 0 ||
                                balance < 128 * multiplier
                              }
                            >
                              {!replying && <Send size={18} />}
                            </Button>
                          </form>
                          <div className="chat-disclaimer">
                            Enter untuk kirim · Shift + Enter untuk baris baru.
                            Penggunaan token disimulasikan.
                          </div>
                        </>
                      )}
                    </section>
                  )}
                  {page === "Statistik" && (
                    <>
                      <div className="stats-grid">
                        <section className="panel stat-card">
                          <span className="small-label">Saldo token</span>
                          <div className="stat-number">
                            {balance.toLocaleString("id-ID")}
                          </div>
                          <span className="muted">token tersedia</span>
                          <Button
                            kind="primary"
                            onClick={() => setPage("Beli Token")}
                          >
                            Isi token
                            <Plus size={16} />
                          </Button>
                        </section>
                        <section className="panel stat-card">
                          <span className="small-label">
                            Pemakaian bulan ini
                          </span>
                          <div className="stat-number">
                            {totalUsage.toLocaleString("id-ID")}
                          </div>
                          <span className="muted">
                            token · data contoh & sesi ini
                          </span>
                          <div className="stat-bottom">
                            <span className="status-dot" />
                            Penggunaan dalam batas normal
                          </div>
                        </section>
                        <section className="panel stat-card">
                          <span className="small-label">Total permintaan</span>
                          <div className="stat-number">
                            {requests.toLocaleString("id-ID")}
                          </div>
                          <span className="muted">permintaan berhasil</span>
                          <div className="stat-bottom">
                            99,8% tingkat keberhasilan
                          </div>
                        </section>
                      </div>
                      {balance < 20000 && (
                        <div className="warning-banner" role="alert">
                          <AlertTriangle size={18} />
                          Saldo di bawah 20.000 token. Isi ulang agar aplikasi
                          tetap berjalan.
                          <Button onClick={() => setPage("Beli Token")}>
                            Isi token
                            <ArrowRight size={14} />
                          </Button>
                        </div>
                      )}
                      <section className="panel usage-panel">
                        <div className="section-heading">
                          <h2>Penggunaan per model</h2>
                          <span>Data contoh & sesi ini</span>
                        </div>
                        {Object.entries(usage)
                          .sort((a, b) => b[1] - a[1])
                          .map(([name, amount]) => (
                            <div className="usage-row" key={name}>
                              <div>
                                <span>{name}</span>
                                <code>
                                  {amount.toLocaleString("id-ID")} token
                                </code>
                              </div>
                              <div className="bar-track">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${(amount / totalUsage) * 100}%`,
                                  }}
                                  transition={{ duration: 0.7 }}
                                />
                              </div>
                            </div>
                          ))}
                      </section>
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Riwayat pembelian</h2>
                          <span>Semua transaksi</span>
                        </div>
                        <div
                          className="table-scroll"
                          tabIndex={0}
                          role="region"
                          aria-label="Riwayat pembelian"
                        >
                          <table>
                            <thead>
                              <tr>
                                <th>TRANSAKSI</th>
                                <th>TANGGAL</th>
                                <th>PAKET</th>
                                <th>TOTAL</th>
                                <th>STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((o) => (
                                <TableRow key={o.id}>
                                  <td>
                                    <code>{o.id}</code>
                                  </td>
                                  <td className="muted">{o.date}</td>
                                  <td>
                                    <Badge tier={o.tier} />
                                  </td>
                                  <td>Rp {o.price}</td>
                                  <td>
                                    <span className="success-tag">
                                      <Check size={13} />
                                      Berhasil
                                    </span>
                                  </td>
                                </TableRow>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </>
                  )}
                  {page === "Dokumentasi" && (
                    <>
                      <div className="docs-intro">
                        <div>
                          <span className="eyebrow">OPENAI-COMPATIBLE</span>
                          <h2>API yang sudah Anda kenal.</h2>
                          <p>
                            Gunakan SDK OpenAI favorit Anda. Cukup ganti base
                            URL dan API key.
                          </p>
                        </div>
                        <Terminal size={44} />
                      </div>
                      <div className="base-url">
                        <span>BASE URL</span>
                        <code>https://api.kios.ai/v1</code>
                        <Button
                          kind="ghost"
                          onClick={() => copy("https://api.kios.ai/v1")}
                          aria-label="Salin base URL"
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                      <p className="docs-demo-note">
                        Contoh integrasi untuk rancangan gateway. Endpoint dan
                        API key prototipe belum terhubung ke layanan nyata.
                      </p>
                      <section className="code-panel">
                        <div className="code-tabs">
                          <div
                            className="code-tab-list"
                            role="tablist"
                            aria-label="Bahasa contoh kode"
                          >
                            {["cURL", "Python", "Node.js"].map((t) => (
                              <button
                                className={codeTab === t ? "active" : ""}
                                onClick={() => setCodeTab(t)}
                                key={t}
                                role="tab"
                                id={`code-tab-${t}`}
                                aria-selected={codeTab === t}
                                aria-controls="code-example"
                                tabIndex={codeTab === t ? 0 : -1}
                                onKeyDown={(e) => {
                                  if (
                                    ![
                                      "ArrowLeft",
                                      "ArrowRight",
                                      "Home",
                                      "End",
                                    ].includes(e.key)
                                  )
                                    return
                                  e.preventDefault()
                                  const tabs = ["cURL", "Python", "Node.js"]
                                  const index =
                                    e.key === "Home"
                                      ? 0
                                      : e.key === "End"
                                        ? 2
                                        : (tabs.indexOf(codeTab) +
                                            (e.key === "ArrowRight" ? 1 : 2)) %
                                          3
                                  setCodeTab(tabs[index])
                                  document
                                    .getElementById(`code-tab-${tabs[index]}`)
                                    ?.focus()
                                }}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <Button kind="ghost" onClick={() => copy(code)}>
                            <Copy size={15} />
                            Salin kode
                          </Button>
                        </div>
                        <pre
                          id="code-example"
                          role="tabpanel"
                          aria-labelledby={`code-tab-${codeTab}`}
                          tabIndex={0}
                        >
                          <code>{code}</code>
                        </pre>
                      </section>
                      <section className="panel docs-models">
                        <h2>Model tersedia</h2>
                        {models.map((m) => (
                          <div className="doc-model" key={m.id}>
                            <code>{m.id}</code>
                            <Badge tier={tiers[m.tier]} />
                          </div>
                        ))}
                      </section>
                      <div className="error-docs">
                        <h2>Menangani respons error</h2>
                        <div>
                          <code>429 · rate_limit_exceeded</code>
                          <p>
                            Terlalu banyak permintaan. Tunggu{" "}
                            <strong>Retry-After: 30 detik</strong> sebelum
                            mencoba kembali.
                          </p>
                        </div>
                        <div>
                          <code>403 · tier_restricted</code>
                          <p>
                            Model tidak tersedia pada tier Anda. Upgrade paket
                            untuk melanjutkan.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {page === "Komponen & States" && (
                    <Suspense fallback={<SkeletonRows />}>
                      <StateStudio onScenario={scenario} onCopy={copy} />
                    </Suspense>
                  )}
                </motion.div>
              </AnimatePresence>
              <footer>
                <span>© 2025 KiosAI. Dibangun untuk ide Anda.</span>
                <div>
                  <span className="status-dot" />
                  Prototipe interaktif<span className="footer-divider">/</span>
                  <button onClick={() => setPage("Komponen & States")}>
                    Komponen & States
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </footer>
            </main>
          </div>
          <nav className="bottom-nav" aria-label="Navigasi utama mobile">
            {navigation.map((n) => (
              <button
                onClick={() => setPage(n.name)}
                className={page === n.name ? "active" : ""}
                key={n.name}
                aria-current={page === n.name ? "page" : undefined}
              >
                <n.icon size={20} />
                <span>{n.short}</span>
              </button>
            ))}
          </nav>
          <AnimatePresence>
            {modal && (
              <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
              >
                <motion.section
                  role="dialog"
                  ref={modalRef}
                  tabIndex={-1}
                  aria-modal="true"
                  aria-label={
                    modal === "payment"
                      ? "Pembayaran QRIS"
                      : modal === "revoke"
                        ? "Cabut API key"
                        : modal === "login"
                          ? "Masuk ke KiosAI"
                          : "Buat API key"
                  }
                  className="modal"
                  initial={{ y: 25, scale: 0.98 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    aria-label="Tutup"
                    className="modal-close"
                    onClick={closeModal}
                  >
                    <X size={20} />
                  </button>
                  {modal === "revoke" ? (
                    <div>
                      <span className="eyebrow">API KEYS / REVOKE</span>
                      <h2>Cabut kunci ini?</h2>
                      <p>
                        Akses demo untuk{" "}
                        <strong>
                          {keys.find((k) => k.key === revokeKey)?.name}
                        </strong>{" "}
                        akan dihapus. Tindakan ini tidak bisa dibatalkan.
                      </p>
                      <div className="modal-actions">
                        <Button onClick={closeModal}>Batal</Button>
                        <Button
                          className="danger"
                          onClick={() => {
                            setKeys((ks) =>
                              ks.filter((k) => k.key !== revokeKey),
                            )
                            closeModal()
                            notify("API key demo dicabut")
                          }}
                        >
                          Ya, cabut kunci
                        </Button>
                      </div>
                    </div>
                  ) : modal === "payment" && paid ? (
                    <div className="payment-success">
                      <div className="payment-success-icon">
                        <CheckCheck size={32} />
                      </div>
                      <span className="eyebrow">PAYMENT / SUCCESS</span>
                      <h2>Siap untuk ide berikutnya.</h2>
                      <p>
                        <strong>{packages[selected].tokens} token</strong> sudah
                        ditambahkan ke saldo demo Anda.
                      </p>
                      <div className="success-summary">
                        <span>Saldo sekarang</span>
                        <code>{balance.toLocaleString("id-ID")} token</code>
                      </div>
                      <div className="success-summary">
                        <span>Tier aktif</span>
                        <Badge tier={tiers[activeTier]} />
                      </div>
                      <Button
                        kind="primary"
                        onClick={() => {
                          closeModal()
                          setPage("API Keys")
                        }}
                      >
                        Lanjut ke API Keys
                        <ArrowRight size={16} />
                      </Button>
                      <Button
                        kind="ghost"
                        onClick={() => {
                          closeModal()
                          setPage("Statistik")
                        }}
                      >
                        Lihat riwayat transaksi
                      </Button>
                      <small className="modal-note">
                        Simulasi selesai. Tidak ada dana yang ditagih.
                      </small>
                    </div>
                  ) : modal === "payment" ? (
                    <>
                      <span className="eyebrow">CHECKOUT / QRIS</span>
                      <h2>
                        {countdown === 0
                          ? "Waktu pembayaran habis."
                          : payment
                            ? "Menunggu konfirmasi"
                            : "Scan. Bayar. Mulai."}
                      </h2>
                      <p>Gunakan e-wallet atau mobile banking favorit Anda.</p>
                      <div className="payment-summary">
                        <Badge tier={packages[selected].name} />
                        <strong>Rp {packages[selected].price}</strong>
                      </div>
                      <div className="qr-wrap">
                        <div className="qris-word">
                          QRIS <span>DEMO PAYMENT</span>
                        </div>
                        <svg
                          viewBox="0 0 210 210"
                          aria-label="QRIS demo, bukan kode pembayaran nyata"
                        >
                          {Array.from({ length: 29 * 29 }, (_, i) => {
                            const x = i % 29,
                              y = Math.floor(i / 29)
                            const finder = (a: number, b: number) =>
                              x >= a && x < a + 7 && y >= b && y < b + 7
                                ? x === a ||
                                  x === a + 6 ||
                                  y === b ||
                                  y === b + 6 ||
                                  (x >= a + 2 &&
                                    x <= a + 4 &&
                                    y >= b + 2 &&
                                    y <= b + 4)
                                : null
                            const f =
                              finder(0, 0) ?? finder(22, 0) ?? finder(0, 22)
                            return (f ?? (x * 13 + y * 7 + x * y) % 5 < 2) ? (
                              <rect
                                key={i}
                                x={x * 7 + 3}
                                y={y * 7 + 3}
                                width="7"
                                height="7"
                              />
                            ) : null
                          })}
                        </svg>
                        <small>KIOSAI · PEMBAYARAN SIMULASI</small>
                      </div>
                      <div className="countdown">
                        <Clock3 size={16} />
                        Selesaikan dalam{" "}
                        <code>
                          {Math.floor(countdown / 60)
                            .toString()
                            .padStart(2, "0")}
                          :{(countdown % 60).toString().padStart(2, "0")}
                        </code>
                      </div>
                      {payment && countdown > 0 && (
                        <div className="pending-info">
                          <LoaderCircle size={17} className="spin" />
                          Pembayaran sedang diverifikasi (demo).
                        </div>
                      )}
                      <Button
                        kind="primary"
                        onClick={() => {
                          if (countdown === 0) buy(selected)
                          else if (!payment) setPayment(true)
                          else completePayment()
                        }}
                      >
                        {countdown === 0
                          ? "Buat pembayaran baru"
                          : payment
                            ? "Simulasikan pembayaran berhasil"
                            : "Saya sudah bayar"}
                        <CheckCheck size={17} />
                      </Button>
                      <small className="modal-note">
                        Demo UI. Tidak ada transaksi atau pembayaran nyata.
                      </small>
                    </>
                  ) : modal === "key" && newSecret ? (
                    <div>
                      <span className="eyebrow">API KEYS / CREATED</span>
                      <h2>Kunci demo siap.</h2>
                      <p>
                        Salin kunci ini dan simpan dengan aman. Kunci demo tidak
                        dapat digunakan untuk mengakses layanan nyata.
                      </p>
                      <div className="new-key-secret">
                        <code>{newSecret}</code>
                      </div>
                      <Button kind="primary" onClick={() => copy(newSecret)}>
                        <Copy size={16} />
                        Salin API key
                      </Button>
                      <Button kind="ghost" onClick={closeModal}>
                        Selesai
                        <Check size={16} />
                      </Button>
                    </div>
                  ) : modal === "key" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!keyName.trim()) return
                        const key =
                          "kios-demo-" + crypto.randomUUID().split("-").join("")
                        setKeys((k) => [
                          ...k,
                          { name: keyName.trim(), key, date: "Hari ini" },
                        ])
                        setKeyName("")
                        setNewSecret(key)
                        notify(
                          "API key demo berhasil dibuat. Salin dan simpan dengan aman.",
                        )
                      }}
                    >
                      <span className="eyebrow">API KEYS</span>
                      <h2>Buat kunci baru</h2>
                      <p>Beri nama agar kunci Anda mudah dikenali.</p>
                      <label htmlFor="key-name">Nama API key</label>
                      <Input
                        autoFocus
                        required
                        id="key-name"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="Contoh: Aplikasi toko"
                        maxLength={60}
                      />
                      <Button
                        kind="primary"
                        type="submit"
                        disabled={!keyName.trim()}
                      >
                        Buat API key
                        <Plus size={16} />
                      </Button>
                    </form>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setLoginError(true)
                      }}
                    >
                      <Logo />
                      <h2>Selamat datang kembali.</h2>
                      <p>Masuk untuk melanjutkan ide Anda.</p>
                      <label htmlFor="email">Email</label>
                      <Input
                        id="email"
                        type="email"
                        autoFocus
                        required
                        placeholder="nama@email.com"
                        autoComplete="email"
                      />
                      <label htmlFor="password">Password</label>
                      <Input
                        id="password"
                        type="password"
                        required
                        placeholder="Masukkan password Anda"
                        aria-invalid={loginError}
                        aria-describedby={
                          loginError ? "login-error" : undefined
                        }
                        autoComplete="current-password"
                        onChange={() => setLoginError(false)}
                      />
                      {loginError && (
                        <p
                          className="field-error"
                          id="login-error"
                          role="alert"
                        >
                          Email atau password tidak cocok. Silakan coba lagi.
                        </p>
                      )}
                      <Button kind="primary" type="submit">
                        Masuk
                        <ArrowRight size={16} />
                      </Button>
                      <small className="modal-note">
                        Form login demonstrasi. Belum terhubung ke layanan
                        autentikasi.
                      </small>
                    </form>
                  )}
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {toast && (
              <motion.div
                role="status"
                className="toast"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <span>
                  <Check size={17} />
                </span>
                {toast}
                <button
                  aria-label="Tutup notifikasi"
                  onClick={() => setToast("")}
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </MotionConfig>
  )
}
export default App
