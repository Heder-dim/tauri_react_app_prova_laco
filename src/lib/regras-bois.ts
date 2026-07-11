export function calcularBoisNu(hcSoma: number): number {
  if (hcSoma <= 3.5) return 1;
  if (hcSoma <= 5.5) return 2;
  if (hcSoma <= 7.5) return 3;
  if (hcSoma <= 9.5) return 4;
  if (hcSoma <= 11.5) return 5;
  return 6; // 12,0 a 14,5 (e qualquer valor acima, por segurança)
}