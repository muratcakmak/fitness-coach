export interface MacroTargets {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  bmr: number;
  tdee: number;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  lose_fat: -400,
  maintain: 0,
  build_muscle: 300,
};

export function calculateTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
  activityLevel: string,
  goal: string
): MacroTargets {
  // Mifflin-St Jeor
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  const tdee = Math.round(bmr * multiplier);
  const adjustment = GOAL_ADJUSTMENTS[goal] ?? 0;
  const calories = Math.round(tdee + adjustment);

  // Protein: 1.6-2.0g/kg (use 1.8 as default)
  const proteinMultiplier = goal === "build_muscle" ? 2.0 : 1.8;
  const protein_g = Math.round(weightKg * proteinMultiplier);

  // Fat: 0.9g/kg
  const fat_g = Math.round(weightKg * 0.9);

  // Carbs: remaining calories
  const proteinCals = protein_g * 4;
  const fatCals = fat_g * 9;
  const carbs_g = Math.max(50, Math.round((calories - proteinCals - fatCals) / 4));

  return { calories, protein_g, fat_g, carbs_g, bmr: Math.round(bmr), tdee };
}
