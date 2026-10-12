export const MIN_PASSWORD_LENGTH = 8;

export const SITE_NAME = "Eagle Arena Tickets"; 
export const CODE_TTL_MINUTES = 10;
export const CODE_RESEND_COOLDOWN_SECONDS = 60;
export const CODE_MAX_ATTEMPTS = 5;
export const PURCHASE_TOKEN_TTL = "15m";

export const MAX_ORDER_AMOUNT_KOBO =2_000_000_000;

export const RESET_TOKEN_TTL_MINUTES = 30;
export const RESET_COOLDOWN_SECONDS = 60;
// The page on the frontend that reads ?token=... and shows the "choose a new password" form.
export const ADMIN_RESET_PATH = "/admin/reset-password";