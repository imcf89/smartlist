const unitMap: Record<string, { base: string; factor: number }> = {
  oz: { base: "oz", factor: 1 }, lb: { base: "oz", factor: 16 }, g: { base: "oz", factor: 0.035274 }, kg: { base: "oz", factor: 35.274 },
  "fl oz": { base: "fl oz", factor: 1 }, pt: { base: "fl oz", factor: 16 }, qt: { base: "fl oz", factor: 32 }, gal: { base: "fl oz", factor: 128 },
  ct: { base: "ct", factor: 1 }, each: { base: "ct", factor: 1 }, ea: { base: "ct", factor: 1 },
};

export function parseSize(text: string) {
  const clean = text.toLowerCase().replace(/×/g, "x");
  const multi = clean.match(/(\d+(?:\.\d+)?)\s*(?:pk|pack|ct)?\s*x\s*(\d+(?:\.\d+)?)\s*(fl oz|oz|lb|g|kg|pt|qt|gal|ct)/);
  const single = clean.match(/(\d+(?:\.\d+)?)\s*(fl oz|oz|lb|g|kg|pt|qt|gal|count|ct)\b/);
  const m = multi || single;
  if (!m) return { quantity: 1, unit: "each", baseQuantity: 1, baseUnit: "ct" };
  const amount = multi ? Number(m[1]) * Number(m[2]) : Number(m[1]);
  const unit = (multi ? m[3] : m[2]).replace("count", "ct");
  const conversion = unitMap[unit] || unitMap.each;
  return { quantity: amount, unit, baseQuantity: amount * conversion.factor, baseUnit: conversion.base };
}

export function requestedBase(quantity: number, unit: string) {
  const normalized = unit.toLowerCase();
  const conversion = unitMap[normalized] || unitMap.each;
  return { amount: quantity * conversion.factor, unit: conversion.base };
}
