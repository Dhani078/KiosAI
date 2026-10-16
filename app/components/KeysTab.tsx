"use client";

import {
  KeyRound,
  Plus,
  ShieldCheck,
  Copy,
  X,
  Terminal,
  ArrowUpRight,
} from "lucide-react";
import { Button, SkeletonRows, TableRow } from "./ui";

export function KeysTab({
  keys,
  loadingKeys,
  onOpenCreateKey,
  onOpenRevokeKey,
  onCopy,
  onNavigateDocs,
}: {
  keys: any[];
  loadingKeys: boolean;
  onOpenCreateKey: () => void;
  onOpenRevokeKey: (key: any) => void;
  onCopy: (text: string) => void;
  onNavigateDocs: () => void;
}) {
  return (
    <>
      <div className="content-toolbar">
        <span>
          API KEY ANDA <span className="count-tag">{keys.length}</span>
        </span>
        <Button kind="primary" onClick={onOpenCreateKey}>
          <Plus size={16} />
          Buat API key
        </Button>
      </div>

      <section className="panel">
        <div className="info-line">
          <ShieldCheck size={18} />
          Jaga kerahasiaan API key Anda. Jangan bagikan di kode publik.
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
                {keys.map((k) => {
                  const displayKey = k.key_prefix
                    ? `${k.key_prefix}••••••••`
                    : k.masked_key || `kios-••••${(k.id || "").slice(-4)}`;
                  const dateStr = k.created_at
                    ? new Date(k.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Baru saja";

                  return (
                    <TableRow key={k.id}>
                      <td>
                        <strong>{k.name || "Default Key"}</strong>
                        <small className="muted" style={{ display: "block" }}>
                          {k.rate_limit_per_min || 60} req/m{k.max_spend_tokens && Number(k.max_spend_tokens) > 0 ? ` · Cap: ${Number(k.max_spend_tokens).toLocaleString("id-ID")}` : ""}
                        </small>
                      </td>
                      <td>
                        <code>{displayKey}</code>
                      </td>
                      <td className="muted">
                        <div>{dateStr}</div>
                        <small style={{ fontSize: "11px", display: "block", opacity: 0.75 }}>
                          {k.last_used_at ? `Dipakai ${new Date(k.last_used_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}` : "Belum dipakai"}
                        </small>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button
                            kind="ghost"
                            onClick={() => onCopy(displayKey)}
                          >
                            <Copy size={16} />
                            <span>Salin</span>
                          </Button>
                          <Button
                            kind="ghost"
                            aria-label={`Cabut API key ${k.name}`}
                            onClick={() => onOpenRevokeKey(k)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <KeyRound size={32} />
            <h2>Belum ada API key.</h2>
            <p>Buat kunci pertama untuk menghubungkan aplikasi Anda.</p>
            <Button kind="primary" onClick={onOpenCreateKey}>
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
            Cukup ubah base URL dan API key. Integrasi Anda tetap sama.
          </p>
        </div>
        <Button onClick={onNavigateDocs}>
          Lihat panduan
          <ArrowUpRight size={16} />
        </Button>
      </div>
    </>
  );
}
export default KeysTab;
