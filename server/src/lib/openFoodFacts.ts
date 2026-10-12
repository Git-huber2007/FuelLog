import { z } from 'zod';
import type { FoodInput } from '@fuellog/shared';
import { HttpError } from '../middleware/errors';

const OffProduct = z.object({
  status: z.number().optional(),
  product: z
    .object({
      product_name: z.string().optional(),
      brands: z.string().optional(),
      serving_size: z.string().optional(),
      nutriments: z.record(z.unknown()).default({}),
    })
    .optional(),
});

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Looks a barcode up on Open Food Facts. Returns null when the product is unknown or has no usable nutrition. */
export async function lookupBarcode(code: string): Promise<FoodInput | null> {
  if (!/^\d{8,14}$/.test(code)) throw new HttpError(400, 'validation', 'Barcodes are 8 to 14 digits.');
  let json: unknown;
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,serving_size,nutriments`, {
      headers: { 'User-Agent': 'FuelLog/1.0 (personal calorie tracker)' },
      signal: AbortSignal.timeout(6_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`status ${res.status}`);
    json = await res.json();
  } catch {
    throw new HttpError(502, 'barcode_unavailable', 'The barcode service did not answer. Try again, or add the food by hand.');
  }

  const parsed = OffProduct.safeParse(json);
  if (!parsed.success) throw new HttpError(502, 'barcode_bad_response', 'The barcode service sent something we could not read. Add the food by hand.');
  const product = parsed.data.product;
  if (!product?.product_name?.trim()) return null;

  const n = product.nutriments;
  const perServing = Number.isFinite(Number(n['energy-kcal_serving'] ?? NaN));
  const suffix = perServing ? '_serving' : '_100g';
  const value = (key: string, max: number) => {
    const v = Number(n[key + suffix] ?? NaN);
    return Number.isFinite(v) ? round1(Math.min(max, Math.max(0, v))) : null;
  };
  const kj = Number(n[`energy${suffix}`] ?? NaN);
  const kcal = value('energy-kcal', 5000) ?? (Number.isFinite(kj) ? round1(Math.min(5000, Math.max(0, kj / 4.184))) : null);
  if (kcal === null) return null;

  const brand = product.brands?.split(',')[0]?.trim();
  const name = product.product_name.trim();
  return {
    name: (brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name).slice(0, 70),
    serving_label: (perServing ? product.serving_size?.trim() || '1 serving' : '100 g').slice(0, 40),
    kcal,
    protein_g: value('proteins', 1000) ?? 0,
    carbs_g: value('carbohydrates', 1000) ?? 0,
    fat_g: value('fat', 1000) ?? 0,
    fibre_g: value('fiber', 1000) ?? 0,
  };
}
