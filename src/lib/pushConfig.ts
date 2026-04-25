/**
 * VAPID Public Key — bu faqat frontend uchun (xavfsiz, oshkor qilsa bo'ladi).
 *
 * Real loyihada generatsiya qilish:
 *   npm install -g web-push
 *   web-push generate-vapid-keys
 *
 * Keyin:
 *   VAPID_PUBLIC_KEY  → shu yerga
 *   VAPID_PRIVATE_KEY → faqat backend .env ga (hech qachon frontendga qo'yma!)
 */
export const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Push xabar yuborish uchun backend endpoint.
 * Mock rejimda bu ishlamaydi — real backendga ulanganda o'zgartir.
 */
export const PUSH_API_BASE = 'http://localhost:8000/api/admin';
