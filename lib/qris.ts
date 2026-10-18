/**
 * EMVCo Dynamic QRIS Generator for DANA Merchant.
 * Mengonversi string QRIS statis DANA menjadi QRIS dinamis ber-nominal terkunci,
 * sehingga pembeli yang scan langsung melihat tagihan tepat tanpa perlu input nominal manual.
 */

export const DEFAULT_DANA_QRIS_STATIC =
  process.env.DANA_QRIS_STATIC ||
  "00020101021126570011ID.DANA.WWW011893600915301403708702090140370870303UMI51440014ID.CO.QRIS.WWW0215ID10265005601920303UMI5204737253033605802ID5905Dhani6015Kab. Hulu Sunga61057131163046489";

/**
 * Menghitung checksum CRC16-CCITT (Polinomial 0x1021) standar EMVCo QRIS.
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Mengubah QRIS Statis menjadi QRIS Dinamis dengan menyisipkan Tag 54 (Nominal Transaksi).
 */
export function generateDynamicQris(amount: number, staticString = DEFAULT_DANA_QRIS_STATIC): string {
  if (!amount || amount <= 0) return staticString;

  // 1. Buang CRC lama (4 karakter terakhir)
  let base = staticString.slice(0, -4);

  // 2. Ubah Point of Initiation Method dari 11 (Static) ke 12 (Dynamic)
  base = base.replace("010211", "010212");

  // 3. Susun Tag 54 (Transaction Amount): 54 + length(2 digit) + amount
  const amountStr = String(Math.round(amount));
  const tag54 = "54" + String(amountStr.length).padStart(2, "0") + amountStr;

  // 4. Sisipkan Tag 54 tepat sebelum Tag 58 (Country Code '5802ID')
  const parts = base.split("5802ID");
  if (parts.length < 2) return staticString;

  const payloadWithoutCrc = parts[0] + tag54 + "5802ID" + parts[1];

  // 5. Hitung CRC baru di atas payload yang diakhiri '6304'
  const payloadToSign = payloadWithoutCrc.slice(0, -4) + "6304";
  const newCrc = calculateCRC16(payloadToSign);

  return payloadToSign + newCrc;
}

/**
 * Mengembalikan URL gambar QR code berkualitas tinggi untuk di-render di antarmuka.
 */
export function getQrisRenderUrl(qrisPayload: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(qrisPayload)}`;
}
