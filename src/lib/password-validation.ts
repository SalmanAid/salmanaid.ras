export const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/";

export type PasswordRequirement = {
  label: string;
  met: boolean;
  icon: string;
};

export function validatePassword(password: string): PasswordRequirement[] {
  return [
    {
      label: "Minimal 8 karakter",
      met: password.length >= 8,
      icon: "characters",
    },
    {
      label: "Mengandung huruf besar (A-Z)",
      met: /[A-Z]/.test(password),
      icon: "uppercase",
    },
    {
      label: "Mengandung huruf kecil (a-z)",
      met: /[a-z]/.test(password),
      icon: "lowercase",
    },
    {
      label: "Mengandung angka (0-9)",
      met: /\d/.test(password),
      icon: "number",
    },
    {
      label: `Mengandung karakter spesial (${SPECIAL_CHARACTERS})`,
      met: new RegExp(`[${SPECIAL_CHARACTERS.replace(/[\[\]\\^-]/g, '\\$&')}]`).test(password),
      icon: "special",
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  const requirements = validatePassword(password);
  return requirements.every((req) => req.met);
}
