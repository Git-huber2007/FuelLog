export const PARSE_PHOTO_PROMPT = `This photo shows either a plate of food or a packaged-food nutrition label.
- Plate: identify each food, estimate the portion visible, and return one item per food for one person eating all of it.
- Nutrition label: return a single item named after the product for one serving as printed on the label. If only per-100 g values are printed, use 100 g and say "100 g" in the name.
Set confidence to "low" when portions are hard to judge.`;
