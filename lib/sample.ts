import type { Offer, Store } from "./types";
import { parseSize } from "./units";

const catalog: Array<[Store, string, string, number, string]> = [
  ["ALDI", "milk", "Friendly Farms Whole Milk, 1 gal", 3.09, "Everyday price"],
  ["Winn-Dixie", "milk", "SE Grocers Whole Milk, 1 gal", 3.49, "Weekly deal"],
  ["ALDI", "eggs", "Goldhen Large Grade A Eggs, 12 ct", 2.19, "Everyday price"],
  ["Winn-Dixie", "eggs", "SE Grocers Large Eggs, 18 ct", 3.49, "Weekly deal"],
  ["ALDI", "chicken", "Kirkwood Fresh Chicken Breasts, 5 lb", 11.45, "$2.29 / lb"],
  ["Winn-Dixie", "chicken", "Boneless Skinless Chicken Breasts, 3 lb", 8.97, "$2.99 / lb"],
  ["ALDI", "bananas", "Bananas, 1 lb", 0.49, "$0.49 / lb"],
  ["Winn-Dixie", "bananas", "Fresh Bananas, 1 lb", 0.59, "$0.59 / lb"],
  ["ALDI", "bread", "L'oven Fresh White Bread, 20 oz", 1.45, "Everyday price"],
  ["Winn-Dixie", "bread", "Nature's Own Butterbread, 20 oz", 2.99, "Weekly deal"],
  ["ALDI", "coffee", "Barissimo Ground Coffee, 12 oz", 5.49, "Everyday price"],
  ["Winn-Dixie", "coffee", "Dunkin' Ground Coffee, 2 x 12 oz", 13.99, "BOGO shown as 2-pack"],
];

export function sampleOffers(query: string): Offer[] {
  const q = query.toLowerCase();
  const matches = catalog.filter(([, key, name]) => key.includes(q) || q.includes(key) || name.toLowerCase().includes(q));
  return matches.map(([store, , name, price, promo], i) => {
    const size = parseSize(name);
    return { id: `sample-${store}-${q}-${i}`, query, store, name, price, packageQuantity: size.baseQuantity, packageUnit: size.baseUnit,
      unitPrice: size.baseQuantity ? price / size.baseQuantity : null, unitLabel: size.baseQuantity ? `$${(price / size.baseQuantity).toFixed(2)} / ${size.baseUnit}` : "—",
      promo, url: store === "ALDI" ? "https://www.aldi.us/store/aldi/storefront?service=pickup&zipcode=32707" : "https://www.winndixie.com/weeklyad",
      status: "sample", updatedAt: new Date().toISOString() };
  });
}
