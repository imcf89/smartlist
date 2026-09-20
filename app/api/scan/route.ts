import { NextRequest, NextResponse } from "next/server";
import type { Offer, ScanResult } from "@/lib/types";
import { parseSize } from "@/lib/units";
import { sampleOffers } from "@/lib/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALDI_MERCHANT = process.env.ALDI_MERCHANT_REFERENCE || "";

async function scanAldi(query: string): Promise<Offer[]> {
  if (!ALDI_MERCHANT) return [];
  const params = new URLSearchParams({ currency: "USD", serviceType: "pickup", "page[limit]": "12", "page[offset]": "0", sort: "relevance", merchantReference: ALDI_MERCHANT, query });
  const response = await fetch(`https://api.aldi.us/v1/catalog-search-product-offers?${params}`, { headers: { accept: "application/json", origin: "https://www.aldi.us", "user-agent": "Mozilla/5.0 SmartList/1.0" }, cache: "no-store", signal: AbortSignal.timeout(8500) });
  if (!response.ok) throw new Error(`ALDI ${response.status}`);
  const json = await response.json();
  const candidates = json?.data?.[0]?.attributes?.productOffers || json?.data?.[0]?.attributes?.products || json?.data || [];
  if (!Array.isArray(candidates)) return [];
  return candidates.slice(0, 8).map((raw: any, i: number) => {
    const p = raw.attributes || raw;
    const name = p.name || p.title || p.description || `ALDI result for ${query}`;
    const price = Number(p.price?.amount || p.price || p.currentPrice?.amount || p.offerPrice || 0);
    const size = parseSize(`${name} ${p.size || p.unitSize || ""}`);
    return { id: `aldi-${p.sku || p.id || i}`, query, store: "ALDI" as const, name, price, packageQuantity: size.baseQuantity, packageUnit: size.baseUnit,
      unitPrice: price > 0 ? price / size.baseQuantity : null, unitLabel: price > 0 ? `$${(price / size.baseQuantity).toFixed(2)} / ${size.baseUnit}` : "—", promo: p.promotion?.description || p.saleLabel,
      image: p.assets?.[0]?.url || p.image?.url, url: p.url ? `https://www.aldi.us${p.url}` : `https://www.aldi.us/store/aldi/storefront?service=pickup&zipcode=32707`, status: "live" as const, updatedAt: new Date().toISOString() };
  }).filter((o: Offer) => o.price > 0);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const queries: string[] = Array.isArray(body.items) ? body.items.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 30) : [];
  const live = await Promise.all(queries.map(q => scanAldi(q).catch(() => [])));
  const liveAldi = live.flat();
  const fallback = queries.flatMap(sampleOffers);
  const offers = [...liveAldi, ...fallback.filter((s: Offer) => !liveAldi.some(l => l.query === s.query && l.store === s.store))];
  const result: ScanResult = { offers, sources: { ALDI: liveAldi.length ? "live" : "sample", "Winn-Dixie": "sample" }, scannedAt: new Date().toISOString(), notes: [
    ...(ALDI_MERCHANT ? [] : ["ALDI live lookup needs the local merchant reference configured in Vercel." ]),
    "Winn-Dixie’s ad does not expose a supported product-search API; sample matches are clearly labeled and the live ad is linked for verification.",
    "Prices, stock, loyalty eligibility, tax, and checkout totals can differ in store."
  ]};
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
