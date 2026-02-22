export interface WisdomEntry {
  text: string;
  source: "huberman" | "ferriss";
  tags: ("nutrition" | "training" | "sleep" | "mindset" | "recovery" | "routine" | "supplements")[];
}

export const WISDOM: WisdomEntry[] = [
  // Huberman
  {
    text: "Get 2-10 minutes of morning sunlight within the first hour of waking. Contacts/glasses OK, sunglasses not. This sets your circadian clock for the entire day.",
    source: "huberman",
    tags: ["routine", "sleep"],
  },
  {
    text: "Delay caffeine 90-120 minutes after waking to work with your natural cortisol peak, not against it.",
    source: "huberman",
    tags: ["routine"],
  },
  {
    text: "11 minutes of cold exposure per week total, across 2-4 sessions. Water should be uncomfortably cold but safe.",
    source: "huberman",
    tags: ["recovery"],
  },
  {
    text: "End cold exposure WITHOUT toweling off or warming up. Force your body to reheat on its own — this maximizes brown fat activation. (Soeberg Principle)",
    source: "huberman",
    tags: ["recovery"],
  },
  {
    text: "Cold water immersion increases dopamine by 250% and norepinephrine by 530%. The effects last for hours.",
    source: "huberman",
    tags: ["recovery", "mindset"],
  },
  {
    text: "Avoid bright light between 10 PM and 4 AM. It decreases dopamine, increases depression and anxiety risk.",
    source: "huberman",
    tags: ["sleep"],
  },
  {
    text: "Dim overhead lights after sunset. Use desk lamps and warm-toned bulbs. Your evening environment shapes your sleep.",
    source: "huberman",
    tags: ["sleep"],
  },
  {
    text: "Afternoon sunlight on skin for 20-30 minutes, 2-3x per week. Increases testosterone, estrogen, mood, and libido in both sexes.",
    source: "huberman",
    tags: ["routine"],
  },
  {
    text: "150-200 minutes of zone 2 cardio per week. This is non-negotiable for cardiovascular health and longevity.",
    source: "huberman",
    tags: ["training"],
  },
  {
    text: "The top 5 actions for health: sleep, movement, nutrients, light, relationships. In that order.",
    source: "huberman",
    tags: ["mindset"],
  },
  {
    text: "Do cold exposure early in the day. It raises body temperature afterward, which promotes wakefulness.",
    source: "huberman",
    tags: ["routine", "recovery"],
  },
  {
    text: "Nasal breathing during exercise increases CO2 tolerance and improves endurance. Mouth breathing is for max effort only.",
    source: "huberman",
    tags: ["training"],
  },
  {
    text: "NSDR (non-sleep deep rest) for 10-20 minutes restores mental and physical energy. It's not meditation — it's deliberate relaxation.",
    source: "huberman",
    tags: ["recovery"],
  },
  {
    text: "Creatine 5g daily — one of the most studied and effective supplements for strength, cognition, and recovery.",
    source: "huberman",
    tags: ["supplements"],
  },
  {
    text: "Magnesium glycinate or threonate, 300-400 mg, 30-60 min before bed for sleep quality.",
    source: "huberman",
    tags: ["supplements", "sleep"],
  },
  {
    text: "Omega-3s: 2-3g EPA per day. Most people are deficient. Critical for mood, inflammation, and brain health.",
    source: "huberman",
    tags: ["supplements"],
  },
  {
    text: "Train resistance 3-4x per week. Alternate between strength (3-5 reps) and hypertrophy (8-12 reps) across the week.",
    source: "huberman",
    tags: ["training"],
  },
  {
    text: "View the sunset or late afternoon light. It's a second anchor point that signals your circadian clock evening is coming.",
    source: "huberman",
    tags: ["routine", "sleep"],
  },
  {
    text: "Deliberate cold exposure is great training for the mind. Count the 'walls' — each urge to quit builds prefrontal cortex control.",
    source: "huberman",
    tags: ["mindset", "recovery"],
  },
  // Ferriss
  {
    text: "The minimum effective dose is the smallest dose that will produce a desired outcome. Anything beyond the MED is wasteful.",
    source: "ferriss",
    tags: ["training", "mindset"],
  },
  {
    text: "The decent method you follow is better than the perfect method you quit.",
    source: "ferriss",
    tags: ["mindset"],
  },
  {
    text: "Eat 30g of protein within 30 minutes of waking. This single habit prevents overeating later in the day.",
    source: "ferriss",
    tags: ["nutrition"],
  },
  {
    text: "Slow-Carb Rule #1: Avoid white carbohydrates. If it's white or could be white, don't eat it.",
    source: "ferriss",
    tags: ["nutrition"],
  },
  {
    text: "Slow-Carb Rule #2: Eat the same few meals over and over. Limiting variety reduces deviation.",
    source: "ferriss",
    tags: ["nutrition"],
  },
  {
    text: "Slow-Carb Rule #3: Don't drink calories. Water, black coffee, unsweetened tea only.",
    source: "ferriss",
    tags: ["nutrition"],
  },
  {
    text: "Slow-Carb Rule #4: Don't eat fruit. Fructose delays fat loss by increasing blood lipids and decreasing fat burning.",
    source: "ferriss",
    tags: ["nutrition"],
  },
  {
    text: "Slow-Carb Rule #5: Take one day off per week. Eat whatever you want. The metabolic spike (28% leptin increase) helps long-term adherence.",
    source: "ferriss",
    tags: ["nutrition"],
  },
  {
    text: "Consistent tracking, even without knowledge of fat loss, will often beat advice from world-class trainers.",
    source: "ferriss",
    tags: ["mindset"],
  },
  {
    text: "Your body is almost always within your control. This is rare in life, perhaps unique.",
    source: "ferriss",
    tags: ["mindset"],
  },
  {
    text: "Make it conscious. Make it a game. Make it competitive. Make it small and temporary.",
    source: "ferriss",
    tags: ["mindset"],
  },
  {
    text: "500 ml of ice water on an empty stomach upon waking increases resting metabolic rate 24-30%.",
    source: "ferriss",
    tags: ["nutrition", "recovery"],
  },
  {
    text: "It is impossible to evaluate, or even understand, anything that you cannot measure.",
    source: "ferriss",
    tags: ["mindset"],
  },
  {
    text: "Seeing progress in changing numbers makes the repetitive fascinating and creates a positive feedback loop.",
    source: "ferriss",
    tags: ["mindset"],
  },
  {
    text: "Did you eat half an Oreo? You need to climb 27 flights of stairs to burn it off. Know the real cost.",
    source: "ferriss",
    tags: ["nutrition", "mindset"],
  },
];

export function getRandomWisdom(tags?: WisdomEntry["tags"][number][]): WisdomEntry {
  const pool = tags && tags.length > 0
    ? WISDOM.filter((w) => w.tags.some((t) => tags.includes(t)))
    : WISDOM;
  const entries = pool.length > 0 ? pool : WISDOM;
  return entries[Math.floor(Math.random() * entries.length)];
}
