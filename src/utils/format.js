export function formatBRL(valor) {
  const centavos = Math.round(valor * 100);
  const temCentavos = centavos % 100 !== 0;
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: temCentavos ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
