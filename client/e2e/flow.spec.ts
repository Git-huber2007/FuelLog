import { test, expect } from '@playwright/test';

test('open /welcome, sign in with a fake session, see the Today page, add a recent food, see it in the Eaten list', async ({ page }) => {
  let loggedFoods: Array<{
    id: string;
    food_id: string | null;
    name: string;
    meal: string;
    servings: number;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    log_date: string;
    created_at: string;
  }> = [];

  // Stub Supabase Auth
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/token')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: 'test-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: '2026-10-13T12:00:00Z',
          },
        }),
      });
    }
    if (url.includes('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
        }),
      });
    }
    return route.fulfill({ status: 200, json: {} });
  });

  // Stub /api endpoints
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes('/api/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            onboarded: true,
            level: 'intermediate',
            program: 'full_body',
            weight_kg: 75,
            target_weight_kg: 75,
            calorie_target: 2000,
            protein_target: 150,
            carbs_target: 200,
            fat_target: 65,
            water_ml: 2500,
            ai_enabled: false,
          },
          aiEnabled: false,
        }),
      });
    }

    if (url.includes('/api/recent-foods')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'Banana',
            food_id: 'banana-123',
            kcal: 105,
            protein_g: 1.3,
            carbs_g: 27,
            fat_g: 0.3,
            serving_label: '1 medium',
            default_grams: 118,
          },
        ]),
      });
    }

    if (url.includes('/api/progress')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          streak: 5,
        }),
      });
    }

    if (method === 'POST' && url.includes('/food')) {
      const postData = req.postDataJSON() as { entries?: Array<{ name: string; food_id?: string; meal: string; servings?: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }> } | null;
      const entries = postData?.entries ?? [];
      const newLogs = entries.map((e, idx) => ({
        id: `saved-log-${Date.now()}-${idx}`,
        food_id: e.food_id ?? null,
        name: e.name,
        meal: e.meal,
        servings: e.servings ?? 1,
        kcal: e.kcal,
        protein_g: e.protein_g,
        carbs_g: e.carbs_g,
        fat_g: e.fat_g,
        log_date: '2026-10-13',
        created_at: new Date().toISOString(),
      }));
      loggedFoods = [...loggedFoods, ...newLogs];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newLogs),
      });
    }

    if (url.includes('/api/days/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          targets: {
            kcal: 2000,
            protein_g: 150,
            carbs_g: 200,
            fat_g: 65,
            water_ml: 2500,
          },
          logs: loggedFoods,
          sets: [],
          check: null,
          weight_kg: 75,
          proteinFoods: [],
        }),
      });
    }

    return route.fulfill({ status: 200, json: {} });
  });

  // 1. Open /welcome
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { name: /Eat for your goal/i })).toBeVisible();

  // 2. Sign in with a fake session
  await page.getByRole('link', { name: 'Sign in' }).first().click();
  await expect(page).toHaveURL(/.*\/login/);

  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('ValidPass123!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // 3. See the Today page
  await expect(page).toHaveURL(/.*\/$/);
  await expect(page.getByRole('heading', { name: 'Add food' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Eaten' })).toBeVisible();

  // 4. Add a recent food (Banana)
  const recentChip = page.getByRole('button', { name: /Add Banana/i });
  await expect(recentChip).toBeVisible();
  await recentChip.click();

  // 5. See it in the Eaten list
  const eatenSection = page.locator('section[aria-labelledby="eaten-title"]');
  await expect(eatenSection.getByText('Banana')).toBeVisible();
});
