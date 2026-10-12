export const parseTextPrompt = (text: string) => `Estimate the nutrition of this meal. Return one item per distinct food, with the quantity in the name.

Meal description:
"""
${text}
"""`;
