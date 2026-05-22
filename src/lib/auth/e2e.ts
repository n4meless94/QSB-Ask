export const E2E_AUTH_COOKIE = "qsb_ask_e2e_auth";

export function isE2EAuthEnabled(cookieValue: string | undefined) {
  return process.env.QSB_ASK_E2E_AUTH === "1" && cookieValue === "1";
}
