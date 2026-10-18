# KiosAI / TokoAI Design System Contract & Craft Specification

Dokumen ini mendefinisikan standar visual, arsitektur tata letak, hierarki tipografi, motion tokens, dan aturan craft untuk antarmuka TokoAI (Landing Page & Dashboard Workspace).

---

## 1. Core Dials & Modes

- **DESIGN_VARIANCE**: `7` (Asymmetric Bento, layered terminal previews, visual breaks, crisp offset alignment)
- **MOTION_INTENSITY**: `5` (Restrained tactile feedback, cubic-bezier spring physics, entry fades, zero infinite loops on static cards)
- **VISUAL_DENSITY**: `4` (Technical developer density with generous breathing room, structured scanability)
- **Modes**:
  - `Persuade` (`/` Landing Page): Convincing conversion funnel, real interactive terminal preview, high credibility.
  - `Operate` (`/dashboard`): Scanability, keyboard accessibility, real-time balance metrics, clean logs and tables.

---

## 2. Color Palette & Semantic Tokens

Satu tema terkunci: Dark Industrial Terminal (Warm Obsidian Canvas & Electric Ember Accent). Tidak ada invert warna atau percampuran cool gray.

| Token | Nilai Hex | Peran Visual |
|---|---|---|
| `--canvas` | `#120F0C` | Latar belakang kanvas dasar (Warm Obsidian) |
| `--surface` | `#1C1714` | Permukaan panel, card, dan modal |
| `--surface-raised` | `#241E1A` | Permukaan elemen elevated / hover state |
| `--border` | `#2E2722` | Garis batas struktural (Warm Hairline) |
| `--primary` | `#F28C38` | Aksen brand utama (Electric Ember) |
| `--primary-hover` | `#D9742A` | Hover state tombol utama |
| `--on-primary` | `#120F0C` | Teks di atas warna primary |
| `--text` | `#F5EFEA` | Teks hierarki utama (WCAG AAA) |
| `--text-muted` | `#A29487` | Teks sekunder, label, dan helper (WCAG AA) |
| `--success` | `#4FBF7A` | Indikator live status, status 200, checkmarks |
| `--warning` | `#F5C542` | Saldo menipis, peringatan kuota |
| `--error` | `#E5533D` | Error state, pembatalan, kuota habis |

---

## 3. Typography & Hierarchy

- **Font Keluarga Utama**: `Inter`, sans-serif (Display & Body)
- **Font Monospace**: `JetBrains Mono`, monospace (Model ID, Tokens, Nilai Rupiah, Latensi, Kode)
- **Aturan Skala**:
  - `H1` Display: `clamp(32px, 5vw, 54px)`, `tracking-[-1.5px]`, `leading-[1.15]`, `font-weight: 700`
  - `H2` Section: `clamp(24px, 3.5vw, 36px)`, `tracking-[-0.8px]`, `leading-[1.2]`, `font-weight: 700`
  - `H3` Card / Feature: `16px - 18px`, `font-weight: 600`
  - Body: `14px - 15px`, `leading-[1.6]`, `color: var(--text-muted)`
  - Eyebrow / Tag: `11px - 12px`, uppercase, `tracking-[0.1em]`, `font-weight: 600`
- **Descender Clearance**: Setiap teks display italic memiliki minimal `leading-[1.1]` dan bottom reserve padding agar tidak memotong karakter `g, j, p, q, y`.

---

## 4. Radii & Geometry Consistency

- **Card / Panel**: `10px` (`var(--radius-card)`)
- **Button / Input**: `6px` (`var(--radius-input)`)
- **Pills / Status Badges**: `9999px` (Full pill)
- **Aturan Ketat**: Tidak mencampur radius tajam (0px) dengan pill tanpa alasan semantik.

---

## 5. Layout & Bento Rhythm

1. **Hero**:
   - Terlihat utuh pada initial viewport (`min-h-[100dvh]` atau `pt-20` proporsional).
   - Dilengkapi visual preview interaktif (Interactive Gateway / Terminal Preview).
   - Maksimal 4 elemen teks utama (Eyebrow/Launch tag, Headline, Subtext max 25 kata, Action CTA bar).
2. **Features (Bento Grid)**:
   - Ritme asimetris (2 card lebar col-span-2 + 2 card kompak col-span-1).
   - Menghindari 6 kartu seragam yang identik.
   - Variasi visual di setiap sel: cuplikan kode, mini flow QRIS, badge latensi, split tarif.
3. **Restriksi Eyebrow**:
   - Maksimal 1 eyebrow per 3 section halaman.
   - Jangan menaruh eyebrow di atas semua section judul (AI tell #1).
4. **Zero Em-Dash (`—`) Rule**:
   - Karakter em-dash dan en-dash dilarang di seluruh tampilan UI, copy, metadata, dan dokumentasi tampilan. Gunakan tanda minus biasa (`-`), titik dua (`:`), atau restrukturisasi kalimat.

---

## 6. Motion & Tactile Physics

- **Transisi Standar**: `all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`
- **Feedback Taktil**: Pada `:active`, tombol dan kartu menggunakan `transform: scale(0.98)` atau `-translate-y-[1px]`.
- **Reduced Motion**: Semua animasi menghormati `@media (prefers-reduced-motion: reduce)` dengan fallback statis seketika.

---

## 7. Responsiveness & Accessibility Guardrails

- **Zero Horizontal Overflow**: Lebar dokumen dan elemen tidak boleh melebihi viewport (`390px` mobile, `768px` tablet, `1440px` desktop).
- **Target Touch Minimum**: Semua elemen interaktif (tombol, input, link navigasi) memiliki area klik minimal `44px` atau padding proporsional.
- **Contrast**: Semua teks label dan body memenuhi standar WCAG AA (minimal rasio 4.5:1 terhadap latar).
