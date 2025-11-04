export function kgToLb(kg: number): number {
  return Math.round(kg * 2.2046226218 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.2046226218) * 10) / 10;
}


