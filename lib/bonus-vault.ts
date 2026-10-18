export const INITIAL_ACTIVE_TOKENS = 250_000;
export const INITIAL_LOCKED_BONUS_TOKENS = 2_250_000;
export const MIN_FIRST_TOPUP_IDR = 10_000;

export interface QuotaExhaustedResponse {
  error: {
    message: string;
    type: string;
    code: string;
    unlock_url: string;
  };
}

/**
 * Membentuk pesan error HTTP 402 yang membimbing user untuk top up
 * dan mencairkan bonus brankas token ke /dashboard (bukan URL fiktif /billing).
 */
export function buildQuotaExhaustedError(
  activeBalance: number,
  lockedBonusBalance: number = 0
): QuotaExhaustedResponse {
  const dashUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : "https://tokoai.my.id/dashboard";

  if (lockedBonusBalance > 0) {
    return {
      error: {
        message:
          `Saldo aktif Anda tersisa ${activeBalance.toLocaleString("id-ID")} token, ` +
          `namun Anda masih memiliki ${lockedBonusBalance.toLocaleString("id-ID")} Token Bonus di Brankas KiosAI! ` +
          `Top-up paket Pro via QRIS mulai Rp10.000 di Dashboard (${dashUrl}) untuk langsung mencairkan ` +
          `seluruh bonus 2.250.000 token + membuka 64 model Pro.`,
        type: "insufficient_quota_bonus_locked",
        code: "bonus_vault_locked",
        unlock_url: dashUrl,
      },
    };
  }

  return {
    error: {
      message:
        `Saldo token KiosAI Anda (${activeBalance.toLocaleString("id-ID")} token) tidak mencukupi. ` +
        `Silakan top-up paket Pro via QRIS instan di Dashboard (${dashUrl}).`,
      type: "insufficient_quota",
      code: "insufficient_quota",
      unlock_url: dashUrl,
    },
  };
}
