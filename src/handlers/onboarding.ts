import type { Context } from "grammy";
import type { Env } from "../config";
import { getUser, upsertUser } from "../db/queries";
import { calculateTargets } from "../services/nutrition";

interface OnboardingStep {
  question: string;
  field: string;
  parse: (text: string) => unknown | null;
}

const STEPS: OnboardingStep[] = [
  {
    question: "What's your age?",
    field: "age",
    parse: (t) => {
      const n = parseInt(t);
      return n >= 13 && n <= 100 ? n : null;
    },
  },
  {
    question: "What's your current weight in kg? (e.g., 92)",
    field: "weight_kg",
    parse: (t) => {
      const n = parseFloat(t);
      return n >= 30 && n <= 300 ? n : null;
    },
  },
  {
    question: "What's your height in cm? (e.g., 183)",
    field: "height_cm",
    parse: (t) => {
      const n = parseFloat(t);
      return n >= 100 && n <= 250 ? n : null;
    },
  },
  {
    question: "What's your gender?\n\nReply *male* or *female*",
    field: "gender",
    parse: (t) => {
      const lower = t.toLowerCase().trim();
      if (lower === "male" || lower === "m") return "male";
      if (lower === "female" || lower === "f") return "female";
      return null;
    },
  },
  {
    question:
      "What's your activity level?\n\n" +
      "1️⃣ *Sedentary* - desk job, little exercise\n" +
      "2️⃣ *Light* - light exercise 1-3 days/week\n" +
      "3️⃣ *Moderate* - moderate exercise 3-5 days/week\n" +
      "4️⃣ *Active* - hard exercise 6-7 days/week\n" +
      "5️⃣ *Very active* - athlete/physical job\n\n" +
      "Reply with a number or name.",
    field: "activity_level",
    parse: (t) => {
      const map: Record<string, string> = {
        "1": "sedentary", sedentary: "sedentary",
        "2": "light", light: "light",
        "3": "moderate", moderate: "moderate",
        "4": "active", active: "active",
        "5": "very_active", "very active": "very_active", very_active: "very_active",
      };
      return map[t.toLowerCase().trim()] ?? null;
    },
  },
  {
    question:
      "What's your primary goal?\n\n" +
      "1️⃣ *Lose fat*\n" +
      "2️⃣ *Maintain weight*\n" +
      "3️⃣ *Build muscle*\n\n" +
      "Reply with a number or name.",
    field: "goal",
    parse: (t) => {
      const map: Record<string, string> = {
        "1": "lose_fat", "lose fat": "lose_fat", lose_fat: "lose_fat", fat: "lose_fat", lose: "lose_fat",
        "2": "maintain", maintain: "maintain", maintenance: "maintain",
        "3": "build_muscle", "build muscle": "build_muscle", build_muscle: "build_muscle", muscle: "build_muscle", bulk: "build_muscle", gain: "build_muscle",
      };
      return map[t.toLowerCase().trim()] ?? null;
    },
  },
];

export async function handleStart(ctx: Context, env: Env): Promise<void> {
  const telegramId = ctx.from!.id;
  const firstName = ctx.from!.first_name ?? null;

  await upsertUser(env, telegramId, { first_name: firstName, onboarding_step: 0 });

  await ctx.reply(
    `👋 Welcome${firstName ? `, ${firstName}` : ""}! I'm your AI fitness coach.\n\n` +
      "I'll help you track meals, workouts, sleep, and weight — all through natural conversation.\n\n" +
      "Let's set up your profile first. I have 6 quick questions.\n\n" +
      STEPS[0].question,
    { parse_mode: "Markdown" }
  );
}

export async function handleOnboardingStep(ctx: Context, env: Env): Promise<boolean> {
  const telegramId = ctx.from!.id;
  const user = await getUser(env, telegramId);
  if (!user || user.onboarding_step >= STEPS.length) return false;

  const step = STEPS[user.onboarding_step];
  const text = ctx.message?.text?.trim();
  if (!text) {
    await ctx.reply("Please send a text reply.");
    return true;
  }

  const parsed = step.parse(text);
  if (parsed === null) {
    await ctx.reply(`Invalid input. ${step.question}`, { parse_mode: "Markdown" });
    return true;
  }

  const nextStep = user.onboarding_step + 1;
  await upsertUser(env, telegramId, {
    [step.field]: parsed,
    onboarding_step: nextStep,
  } as Record<string, unknown> as never);

  if (nextStep < STEPS.length) {
    await ctx.reply(STEPS[nextStep].question, { parse_mode: "Markdown" });
  } else {
    // Onboarding complete — calculate targets
    const updatedUser = await getUser(env, telegramId);
    if (updatedUser?.weight_kg && updatedUser.height_cm && updatedUser.age && updatedUser.gender && updatedUser.activity_level && updatedUser.goal) {
      const targets = calculateTargets(
        updatedUser.weight_kg,
        updatedUser.height_cm,
        updatedUser.age,
        updatedUser.gender,
        updatedUser.activity_level,
        updatedUser.goal
      );

      await upsertUser(env, telegramId, {
        target_calories: targets.calories,
        target_protein_g: targets.protein_g,
        target_fat_g: targets.fat_g,
        target_carbs_g: targets.carbs_g,
      });

      const bmi = (updatedUser.weight_kg / (updatedUser.height_cm / 100) ** 2).toFixed(1);

      await ctx.reply(
        `✅ *Profile complete!*\n\n` +
          `BMI: ${bmi} | BMR: ${targets.bmr} kcal | TDEE: ${targets.tdee} kcal\n\n` +
          `*Your daily targets:*\n` +
          `🔥 Calories: ${targets.calories} kcal\n` +
          `🥩 Protein: ${targets.protein_g}g\n` +
          `🧈 Fat: ${targets.fat_g}g\n` +
          `🍚 Carbs: ${targets.carbs_g}g\n\n` +
          `Now just send me messages naturally:\n` +
          `• _"Had chicken and rice for lunch"_\n` +
          `• _"Did squats 3x10 at 60kg"_\n` +
          `• _"Slept 11pm to 7am"_\n` +
          `• _"82.5 kg"_ (to log weight)\n` +
          `• Send a food photo to log a meal\n` +
          `• /report for daily summary\n` +
          `• /weekly for weekly trends\n\n` +
          `Let's go! 💪`,
        { parse_mode: "Markdown" }
      );
    }
  }

  return true;
}
