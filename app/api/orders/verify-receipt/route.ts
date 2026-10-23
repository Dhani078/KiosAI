import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Metode verifikasi manual dinonaktifkan. Seluruh transaksi wajib melalui DOKU QRIS resmi.",
    },
    { status: 410 }
  );
}
