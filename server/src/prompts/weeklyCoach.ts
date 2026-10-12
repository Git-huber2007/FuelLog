export const weeklyCoachPrompt = (data: object) => `Write a weekly review for this gym beginner from their last 7 days.

Data:
${JSON.stringify(data)}

Give a one-sentence headline, up to three things that went well, up to three specific things to improve
with a concrete action each, and one focus for next week. Base every point on the data. If fewer than
3 days were logged, say the data is too thin and make consistent logging the focus.`;

export const COACH_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    wins: { type: 'array', maxItems: 3, items: { type: 'string' } },
    improve: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: { issue: { type: 'string' }, action: { type: 'string' } },
        required: ['issue', 'action'],
      },
    },
    next_week_focus: { type: 'string' },
  },
  required: ['headline', 'wins', 'improve', 'next_week_focus'],
};
