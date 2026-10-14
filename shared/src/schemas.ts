import { z } from 'zod';
import { isKnownExercise, LEVELS } from './library';
import { PROGRAM_KEYS } from './split';

export const DateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => {
  const [year, month, day] = d.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
});
export const Meal        = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const ProfileInput = z.object({
  sex: z.enum(['male', 'female']),
  age: z.number().int().min(14).max(90),
  height_cm: z.number().min(120).max(230),
  weight_kg: z.number().min(30).max(250),
  goal: z.enum(['cut', 'maintain', 'gain']),
  // Optional so a profile saved by an older cached copy of the app keeps its stored level and program.
  level: z.enum(LEVELS).optional(),
  program: z.enum(PROGRAM_KEYS).optional(),
});
const Macro = z.number().min(0).max(1000);
export const FoodInput = z.object({
  name: z.string().trim().min(1).max(80),
  serving_label: z.string().trim().max(40).default('1 serving'),
  kcal: z.number().min(0).max(5000),
  protein_g: Macro.default(0), carbs_g: Macro.default(0), fat_g: Macro.default(0), fibre_g: Macro.default(0),
});
export const LogSource = z.enum(['list', 'custom', 'ai_text', 'ai_photo', 'barcode', 'saved_meal']);
export const LogEntryInput = z.object({
  meal: Meal,
  food_id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  servings: z.number().positive().max(50).default(1),
  kcal: z.number().min(0).max(10000),
  protein_g: Macro, carbs_g: Macro, fat_g: Macro, fibre_g: Macro,
  source: LogSource,
});
export const AddFoodBody   = z.object({ entries: z.array(LogEntryInput).min(1).max(30) });
export const CheckInput    = z.object({
  water_ml: z.number().int().min(0).max(10000),
  sleep_hours: z.number().min(0).max(16).nullable(),
  creatine: z.boolean(), protein_shake: z.boolean(),
  // Optional so a save from an older cached copy of the app leaves the stored count alone.
  steps: z.number().int().min(0).max(100000).optional(),
});
export const WeightInput   = z.object({ weight_kg: z.number().min(30).max(250) });
export const MeasureInput  = z.object({
  waist_cm: z.number().min(30).max(250).nullable(),
  chest_cm: z.number().min(30).max(250).nullable(),
  arm_cm:   z.number().min(10).max(100).nullable(),
});
export const SetInput      = z.object({
  exercise_key: z.string().max(60),
  set_number: z.number().int().min(1).max(10),
  weight_kg: z.number().min(0).max(500),
  reps: z.number().int().min(0).max(3600),
  // Cardio only: treadmill or hill gradient in percent, negative for a decline.
  incline_pct: z.number().min(-15).max(40).nullable().optional(),
}).refine(s => isKnownExercise(s.exercise_key), { message: 'Unknown exercise', path: ['exercise_key'] });
export const SavedMealBody = z.object({ name: z.string().trim().min(1).max(40), date: DateParam });
export const ParseTextBody = z.object({ text: z.string().trim().min(2).max(500), date: DateParam, meal: Meal });
export const ParsePhotoBody = z.object({
  imageBase64: z.string().min(100).max(5_600_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  date: DateParam, meal: Meal,
});
export const BarcodeParam  = z.string().regex(/^\d{8,14}$/);
export const AiItems = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(80),
    kcal: z.number().min(0).max(5000),
    protein_g: z.number().min(0).max(400), carbs_g: z.number().min(0).max(800),
    fat_g: z.number().min(0).max(400), fibre_g: z.number().min(0).max(150),
    confidence: z.enum(['low', 'medium', 'high']),
  })).max(12),
  note: z.string().max(300),
});
export const CoachResult = z.object({
  headline: z.string().max(200),
  wins: z.array(z.string().max(200)).max(3),
  improve: z.array(z.object({ issue: z.string().max(200), action: z.string().max(200) })).max(3),
  next_week_focus: z.string().max(200),
});

// Route-level schemas not listed in the spec but needed by the routes in section 12.
export const DateParams       = z.object({ date: DateParam });
export const IdParams         = z.object({ id: z.string().uuid() });
export const ExerciseParams   = z.object({ date: DateParam, key: z.string().max(60).refine(isKnownExercise, 'Unknown exercise') });
export const ExerciseKeyParam  = z.object({ key: z.string().max(60).refine(isKnownExercise, 'Unknown exercise') });
export const BarcodeParams    =z.object({ code: BarcodeParam });
export const FoodQuery        = z.object({ q: z.string().trim().max(80).default('') });
export const LogSavedMealBody = z.object({ date: DateParam, meal: Meal });
export const PhotoBody        = z.object({
  log_date: DateParam,
  storage_path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/),
});
export const Credentials      = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export const RoutineExerciseInput = z.object({
  key: z.string().max(60).refine(isKnownExercise, 'Unknown exercise'),
  sets: z.number().int().min(1).max(10),
  reps_low: z.number().int().min(1).max(3600),
  reps_high: z.number().int().min(1).max(3600),
}).refine((e) => e.reps_high >= e.reps_low, { message: 'reps_high must be greater than or equal to reps_low', path: ['reps_high'] });

export const RoutineDayInput = z.object({
  title: z.string().trim().max(40),
  exercises: z.array(RoutineExerciseInput).max(15),
});

export const WeekdayParams = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
});

export type Meal = z.infer<typeof Meal>;
export type LogSource = z.infer<typeof LogSource>;
export type ProfileInput = z.infer<typeof ProfileInput>;
export type Sex = ProfileInput['sex'];
export type Goal = ProfileInput['goal'];
export type FoodInput = z.infer<typeof FoodInput>;
export type LogEntryInput = z.input<typeof LogEntryInput>;
export type AddFoodBody = z.infer<typeof AddFoodBody>;
export type CheckInput = z.infer<typeof CheckInput>;
export type MeasureInput = z.infer<typeof MeasureInput>;
export type SetInput = z.infer<typeof SetInput>;
export type AiItems = z.infer<typeof AiItems>;
export type CoachResult = z.infer<typeof CoachResult>;
export type RoutineExerciseInput = z.infer<typeof RoutineExerciseInput>;
export type RoutineDayInput = z.infer<typeof RoutineDayInput>;
export type WeekdayParams = z.infer<typeof WeekdayParams>;

