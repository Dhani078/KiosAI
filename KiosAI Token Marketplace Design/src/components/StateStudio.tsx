import { useState } from "react"
import { ArrowRight, Check, Copy, LockKeyhole, Plus } from "lucide-react"
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  Input,
  SkeletonRows,
  TableRow,
  type ButtonKind,
} from "./ui"

export default function StateStudio({
  onScenario,
  onCopy,
}: {
  onScenario: (scenario: string) => void
  onCopy: (text: string) => void
}) {
  const [value, setValue] = useState("")
  const kinds: ButtonKind[] = ["primary", "secondary", "ghost"]
  return (
    <div className="studio">
      <Card className="studio-section">
        <div className="section-heading">
          <div>
            <h2>Komponen, bukan kebetulan.</h2>
            <p>Elemen yang sama digunakan di seluruh workspace.</p>
          </div>
          <span>UI KIT / v1.0</span>
        </div>
        <div
          className="component-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Varian Button"
        >
          <table className="button-matrix">
            <thead>
              <tr>
                <th>BUTTON</th>
                <th>DEFAULT</th>
                <th>HOVER</th>
                <th>DISABLED</th>
                <th>LOADING</th>
              </tr>
            </thead>
            <tbody>
              {kinds.map((kind) => (
                <tr key={kind}>
                  <td>{kind}</td>
                  <td>
                    <Button kind={kind} onClick={() => onCopy("KiosAI")}>
                      Lanjutkan
                      <ArrowRight size={14} />
                    </Button>
                  </td>
                  <td>
                    <Button
                      kind={kind}
                      className="is-hover"
                      onClick={() => onCopy("KiosAI")}
                    >
                      Lanjutkan
                      <ArrowRight size={14} />
                    </Button>
                  </td>
                  <td>
                    <Button kind={kind} disabled>
                      Lanjutkan
                    </Button>
                  </td>
                  <td>
                    <Button kind={kind} loading>
                      Memproses
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="studio-grid">
        <Card className="studio-section">
          <h2>Input</h2>
          <label htmlFor="studio-input">Nama project</label>
          <Input
            id="studio-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Contoh: Toko online"
          />
          <small>Label selalu terlihat, bahkan saat field terisi.</small>
          <label htmlFor="studio-error">Password · error</label>
          <Input
            id="studio-error"
            type="password"
            defaultValue="demo-password"
            aria-invalid="true"
            aria-describedby="studio-error-message"
          />
          <p id="studio-error-message" className="field-error">
            Password tidak cocok. Silakan coba lagi.
          </p>
          <label htmlFor="studio-disabled">Field nonaktif</label>
          <Input id="studio-disabled" disabled value="Tidak tersedia" />
        </Card>
        <Card className="studio-section">
          <h2>Badge & card</h2>
          <div className="badge-examples">
            {["Bronze", "Silver", "Gold"].map((t) => (
              <Badge key={t} tier={t} />
            ))}
          </div>
          <div className="mini-card">
            <span className="small-label">Token tersedia</span>
            <strong className="stat-number">124.580</strong>
            <p>Border tipis. Tanpa glow. Data menjadi fokus.</p>
            <Button kind="primary" onClick={() => onScenario("purchase")}>
              Beli token
              <Plus size={16} />
            </Button>
          </div>
          <div className="success-tag">
            <Check size={16} />
            Pembayaran berhasil
          </div>
          <div className="locked-example">
            <LockKeyhole size={16} />
            Upgrade ke Silver
          </div>
        </Card>
      </div>
      <Card className="studio-section">
        <div className="section-heading">
          <h2>Table row & skeleton</h2>
          <span>LOADING STATE</span>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Contoh table row"
        >
          <table>
            <thead>
              <tr>
                <th>NAMA</th>
                <th>API KEY</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              <TableRow>
                <td>Project utama</td>
                <td>
                  <code>kios-••••a3f</code>
                </td>
                <td>
                  <Button
                    kind="ghost"
                    onClick={() => onCopy("kios-demo-example-a3f")}
                  >
                    <Copy size={16} />
                    Salin
                  </Button>
                </td>
              </TableRow>
            </tbody>
          </table>
        </div>
        <SkeletonRows />
      </Card>
      <CodeBlock
        code={
          'HTTP/1.1 429 Too Many Requests\nRetry-After: 30\n\n{"error":{"code":"rate_limit_exceeded"}}'
        }
        onCopy={() => onCopy('{"error":{"code":"rate_limit_exceeded"}}')}
        label="Respons rate limit"
      />
      <Card className="studio-section">
        <div className="section-heading">
          <div>
            <h2>Jelajahi seluruh state</h2>
            <p>
              Kontrol ini hanya untuk menguji prototipe. Tidak ada transaksi
              nyata.
            </p>
          </div>
        </div>
        <div className="scenario-grid">
          {[
            [
              "login",
              "Login & error field",
              "Buka formulir login demonstrasi.",
            ],
            [
              "rate",
              "429 · Rate limit",
              "Countdown Retry-After selama 30 detik.",
            ],
            [
              "locked",
              "403 · Tier restricted",
              "Lihat model terkunci tanpa mengubah tier akun.",
            ],
            ["low", "Saldo rendah", "Atur saldo demo menjadi 15.000 token."],
            [
              "loading",
              "Skeleton rows",
              "Simulasikan pengambilan data API key.",
            ],
            [
              "empty",
              "Empty state · API keys",
              "Kosongkan daftar kunci demo untuk melihat state awal.",
            ],
            [
              "purchase",
              "Pembayaran QRIS",
              "Uji pending, sukses, dan tier upgrade.",
            ],
            [
              "expired",
              "Pembayaran kedaluwarsa",
              "Tampilkan countdown habis dan buat QR baru.",
            ],
          ].map(([id, title, description]) => (
            <button
              className="scenario-button"
              key={id}
              onClick={() => onScenario(id)}
            >
              <div>
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      </Card>
      <div className="token-export">
        <div>
          <h3>Token desain, siap digunakan.</h3>
          <p>
            Format JSON untuk workflow token yang kompatibel. Ini bukan Figma
            variables native.
          </p>
        </div>
        <a
          className="button secondary"
          href={`${import.meta.env.BASE_URL}kiosai-tokens.json`}
          download
        >
          Unduh token JSON
          <ArrowRight size={16} />
        </a>
      </div>
      <div className="demo-reset">
        <div>
          <h3>Kembali ke kondisi awal</h3>
          <p>
            Data hanya berlaku di sesi halaman ini dan akan direset saat
            refresh.
          </p>
        </div>
        <Button onClick={() => onScenario("reset")}>Reset data demo</Button>
      </div>
    </div>
  )
}
