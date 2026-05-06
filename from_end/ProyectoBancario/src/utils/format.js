export const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(n))

export const fmtDate = (iso) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))

export const fmtAccountNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  if (digits.length > 8) parts.push(digits.slice(8, 12))
  return parts.join('-')
}

export const ACCOUNT_NUMBER_PATTERN = /^\d{4}-\d{4}-\d{4}$/
