# WhatsApp Backend API Usage

Dokumen ini menjelaskan cara developer project ini mengirim pesan WhatsApp melalui backend SalmanAid.

Integrasi ini **tidak boleh dipanggil langsung dari browser/frontend**. Secret WhatsApp bot hanya boleh dibaca oleh server.

## Environment Variables

Pastikan variabel berikut tersedia di `.env` lokal dan environment deployment:

```env
WA_API_URL=""
WA_API_TOKEN=""
WA_HMAC_SECRET=""
```

`WA_API_URL` adalah base URL server WhatsApp Bot. Jangan tambahkan `/messages` di env karena service akan menambahkannya sendiri.

## Cara Utama: Panggil Service Dari Backend

Gunakan `WhatsAppService.sendMessage()` dari server code, API route, service, cron, atau worker.

```ts
import { WhatsAppService } from "@/services/whatsapp.service";

await WhatsAppService.sendMessage({
  to: "6285546772321",
  message: "Pengajuan pinjaman Anda telah disetujui.",
});
```

Input:

- `to`: nomor HP tujuan. Server WhatsApp Bot akan menormalisasi ke digit.
- `message`: isi pesan. Maksimal 4096 karakter.

Response sukses mengikuti response WhatsApp Bot:

```json
{
  "ok": true,
  "to": "6285546772321@c.us",
  "messageId": "false_6285546772321@c.us_XXXXXXXXXXXXXXXX"
}
```

## Error Handling

`WhatsAppService.sendMessage()` akan throw `WhatsAppServiceError` jika request ke server WhatsApp Bot gagal.

```ts
import {
  WhatsAppService,
  WhatsAppServiceError,
} from "@/services/whatsapp.service";

try {
  await WhatsAppService.sendMessage({
    to: "6285546772321",
    message: "Pesan dari backend.",
  });
} catch (error) {
  if (error instanceof WhatsAppServiceError) {
    console.error("WA failed", {
      status: error.status,
      data: error.data,
    });
  }

  throw error;
}
```

Status penting dari server WhatsApp Bot:

- `400`: input invalid.
- `401`: token/signature/timestamp invalid.
- `404`: nomor tidak terdaftar di WhatsApp.
- `409`: replay request terdeteksi.
- `429`: rate limit.
- `503`: WhatsApp client belum ready atau session belum login.

## Internal API Route

Tersedia route backend:

```http
POST /api/whatsapp/messages
Content-Type: application/json
```

Body:

```json
{
  "to": "6285546772321",
  "message": "Halo dari backend SalmanAid"
}
```

Route ini:

- hanya membaca secret dari backend env,
- melakukan request server-to-server ke WhatsApp Bot,
- membutuhkan session login,
- saat ini dibatasi untuk role `ADMIN`.

Route ini cocok untuk testing manual/internal admin. Untuk fitur aplikasi yang berjalan di backend, lebih disarankan memanggil `WhatsAppService.sendMessage()` langsung.

## Contoh Dari API Route Feature

```ts
import { NextResponse } from "next/server";
import { WhatsAppService } from "@/services/whatsapp.service";

export async function POST() {
  await WhatsAppService.sendMessage({
    to: "6285546772321",
    message: "Dana pinjaman Anda telah dialokasikan.",
  });

  return NextResponse.json({ ok: true });
}
```

## Catatan Keamanan

- Jangan import atau panggil service ini dari client component.
- Jangan memakai `NEXT_PUBLIC_` untuk token atau HMAC secret.
- Jangan kirim request langsung dari browser ke `WA_API_URL`.
- Jika butuh dipakai frontend, frontend harus memanggil API route project ini, lalu API route project ini yang memanggil `WhatsAppService`.
- Jangan log `WA_API_TOKEN` atau `WA_HMAC_SECRET`.

## File Terkait

- Service utama: `src/services/whatsapp.service.ts`
- Validasi input: `src/schemas/whatsapp.schema.ts`
- Internal route: `src/app/api/whatsapp/messages/route.ts`
- Kontrak server bot: `WABOT_INTEGRATION.md`
