export function formatMoney(amount: number, currency = "₽") {
  return new Intl.NumberFormat("ru-RU").format(amount) + " " + currency;
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}