/** Public site copy — override via NEXT_PUBLIC_SUPPORT_EMAIL in .env */
export function getSupportEmail(): string {
  const v = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  return v && v.length > 0 ? v : 'support@fetch.fitness'
}
