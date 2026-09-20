"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ListItem, Offer, ScanResult, Store } from "@/lib/types";
import { requestedBase } from "@/lib/units";

const starter: ListItem[] = [
  { id: "milk", name: "Milk", quantity: 1, unit: "gal", checked: false },
  { id: "eggs", name: "Eggs", quantity: 12, unit: "ct", checked: false },
  { id: "chicken", name: "Chicken breast", quantity: 3, unit: "lb", checked: false },
];
const units = ["each", "ct", "oz", "lb", "fl oz", "gal"];

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function Icon({ name }: { name: "plus" | "scan" | "trash" | "check" | "spark" | "pin" | "arrow" }) {
  const paths: Record<string, React.ReactNode> = {
    plus: <><path d="M12 5v14M5 12h14" /></>, scan: <><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M7 12h10M9 9h6M9 15h6"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>, check: <path d="m5 12 4 4L19 6"/>,
    spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>, arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [items, setItems] = useState<ListItem[]>(starter);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("each");
  const [mode, setMode] = useState<"total" | "unit">("total");
  const [results, setResults] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("smartlist-items-v1");
    if (raw) try { setItems(JSON.parse(raw)); } catch { /* keep starter */ }
  }, []);
  useEffect(() => { localStorage.setItem("smartlist-items-v1", JSON.stringify(items)); }, [items]);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setItems(v => [...v, { id: crypto.randomUUID(), name: name.trim(), quantity: Math.max(.01, qty), unit, checked: false }]);
    setName(""); setQty(1); setUnit("each");
  }

  async function scan() {
    const active = items.filter(i => !i.checked);
    if (!active.length) { setNotice("Add at least one unpurchased item first."); return; }
    setLoading(true); setNotice("");
    try {
      const r = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: active.map(i => i.name) }) });
      if (!r.ok) throw new Error();
      setResults(await r.json());
    } catch { setNotice("The stores didn’t answer this scan. Your list is safe—try again in a moment."); }
    finally { setLoading(false); }
  }

  const recommendations = useMemo(() => {
    if (!results) return [];
    return items.filter(i => !i.checked).map(item => {
      const matches = results.offers.filter(o => o.query.toLowerCase() === item.name.toLowerCase());
      const requested = requestedBase(item.quantity, item.unit);
      const scored = matches.map(offer => {
        const compatible = offer.packageUnit === requested.unit;
        const packs = compatible ? Math.max(1, Math.ceil(requested.amount / offer.packageQuantity)) : Math.max(1, Math.ceil(item.quantity));
        return { ...offer, packs, total: offer.price * packs, score: mode === "unit" ? (offer.unitPrice ?? offer.price) : offer.price * packs };
      }).sort((a, b) => a.score - b.score);
      return { item, best: scored[0], alternatives: scored.slice(1, 3) };
    });
  }, [results, items, mode]);

  const totals = useMemo(() => recommendations.reduce((acc, row) => {
    if (row.best) { acc.total += row.best.total; acc[row.best.store] += row.best.total; }
    return acc;
  }, { total: 0, ALDI: 0, "Winn-Dixie": 0 } as Record<"total" | Store, number>), [recommendations]);

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="SmartList home"><span><Icon name="check" /></span>smartlist</a>
      <div className="location"><Icon name="pin" /><div><small>YOUR STORES</small><strong>Winter Springs, FL</strong></div></div>
    </header>

    <section className="hero" id="top">
      <div className="eyebrow"><Icon name="spark" /> Shop smart. Spend less.</div>
      <h1>Your grocery list,<br/><em>optimized.</em></h1>
      <p>SmartList checks local deals and package sizes to show you exactly where each item costs less.</p>
      <div className="store-pills"><span className="aldi-dot"/> ALDI <b>+</b> <span className="wd-dot"/> Winn-Dixie <small>Sun Lake Plaza</small></div>
    </section>

    <div className="workspace">
      <section className="panel list-panel">
        <div className="panel-title"><div><span>01</span><h2>Build your list</h2></div><small>{items.filter(i => !i.checked).length} items</small></div>
        <form className="add-form" onSubmit={add}>
          <label className="item-input"><span>ITEM</span><input aria-label="Item name" value={name} onChange={e => setName(e.target.value)} placeholder="What do you need?" /></label>
          <label><span>QTY</span><input aria-label="Quantity" type="number" min=".01" step=".01" value={qty} onChange={e => setQty(Number(e.target.value))}/></label>
          <label><span>UNIT</span><select aria-label="Unit" value={unit} onChange={e => setUnit(e.target.value)}>{units.map(u => <option key={u}>{u}</option>)}</select></label>
          <button className="add" aria-label="Add item"><Icon name="plus"/></button>
        </form>
        <div className="items">
          {items.length === 0 && <div className="empty">Your list is empty. Add the first thing you need above.</div>}
          {items.map(item => <div className={`list-row ${item.checked ? "done" : ""}`} key={item.id}>
            <button className="checkbox" onClick={() => setItems(v => v.map(x => x.id === item.id ? { ...x, checked: !x.checked } : x))}>{item.checked && <Icon name="check"/>}</button>
            <div><strong>{item.name}</strong><small>{item.quantity} {item.unit}</small></div>
            <button className="trash" aria-label={`Remove ${item.name}`} onClick={() => setItems(v => v.filter(x => x.id !== item.id))}><Icon name="trash"/></button>
          </div>)}
        </div>
        <div className="privacy"><span>●</span> Saved privately in this browser — no account needed.</div>
      </section>

      <section className="panel scan-panel">
        <div className="panel-title"><div><span>02</span><h2>Choose your strategy</h2></div></div>
        <div className="modes">
          <button className={mode === "total" ? "active" : ""} onClick={() => setMode("total")}><i>$</i><span><strong>Lowest trip total</strong><small>Buy the cheapest package that covers the amount you need.</small></span></button>
          <button className={mode === "unit" ? "active" : ""} onClick={() => setMode("unit")}><i>÷</i><span><strong>Best price per unit</strong><small>Prioritize long-term value, even when the package costs more.</small></span></button>
        </div>
        <button className="scan" onClick={scan} disabled={loading}><Icon name="scan" />{loading ? "Checking local prices…" : results ? "Scan again" : "Scan both stores"}<Icon name="arrow"/></button>
        <p className="scan-copy">Checks current advertised pricing for your saved local stores. No retailer login is stored.</p>
        {notice && <div className="notice">{notice}</div>}
        <div className="source-status">
          <div><span className={results?.sources.ALDI === "live" ? "live" : "sample"}/><b>ALDI</b><small>{results ? results.sources.ALDI : "ready"}</small></div>
          <div><span className={results?.sources["Winn-Dixie"] === "live" ? "live" : "sample"}/><b>Winn-Dixie</b><small>{results ? results.sources["Winn-Dixie"] : "ready"}</small></div>
        </div>
      </section>
    </div>

    {results && <section className="results">
      <div className="results-head"><div><span>03</span><h2>Your smartest route</h2><p>{mode === "total" ? "Optimized for the lowest checkout total" : "Optimized for the lowest normalized unit price"}</p></div><div className="estimate"><small>ESTIMATED TOTAL</small><strong>{money(totals.total)}</strong></div></div>
      <div className="route-summary"><div><span className="aldi-dot"/><b>ALDI</b><strong>{money(totals.ALDI)}</strong></div><div><span className="wd-dot"/><b>Winn-Dixie</b><strong>{money(totals["Winn-Dixie"])}</strong></div></div>
      <div className="recommendations">
        {recommendations.map(({ item, best, alternatives }) => <article key={item.id}>
          <div className="wanted"><small>YOU NEED</small><b>{item.name}</b><span>{item.quantity} {item.unit}</span></div>
          {best ? <div className="winning">
            <div className={`store-tag ${best.store === "ALDI" ? "aldi" : "wd"}`}>{best.store}</div>
            <div className="product"><strong>{best.name}</strong><span>{best.packs > 1 ? `${best.packs} packages · ` : ""}{best.promo || "Current price"}</span><small>{best.status === "live" ? "Live retailer result" : "Example estimate — verify in ad"}</small></div>
            <div className="price"><strong>{money(best.total)}</strong><span>{best.unitLabel}</span></div>
            <a href={best.url} target="_blank" rel="noreferrer">Verify <Icon name="arrow"/></a>
          </div> : <div className="no-match">No close advertised match found. Keep it on your list and check in-store.</div>}
          {alternatives.length > 0 && <details><summary>Compare {alternatives.length} alternative{alternatives.length > 1 ? "s" : ""}</summary>{alternatives.map((a: Offer & {total:number}) => <div className="alternative" key={a.id}><span>{a.store} · {a.name}</span><b>{money(a.total)}</b></div>)}</details>}
        </article>)}
      </div>
      <div className="disclaimer"><strong>Quick price check</strong><span>Scanned {new Date(results.scannedAt).toLocaleString()}. {results.notes.join(" ")}</span></div>
    </section>}

    <footer><span>smartlist</span><p>Built for fewer tabs, faster trips, and a little more left in your wallet.</p><div><a href="https://www.winndixie.com/weeklyad" target="_blank">Winn-Dixie ad</a><a href="https://www.aldi.us/store/aldi/storefront?service=pickup&zipcode=32707" target="_blank">ALDI storefront</a></div></footer>
  </main>;
}
