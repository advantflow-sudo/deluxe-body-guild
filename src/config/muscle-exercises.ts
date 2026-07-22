/**
 * Curated 3-exercise recommendations for each muscle group used by the
 * Target Your Body page. Demo videos reuse existing animated MP4 assets;
 * still images fall back when video is not available.
 */
import workout1 from "@/assets/workout-1.jpg";
import workout2 from "@/assets/workout-2.jpg";
import workout3 from "@/assets/workout-3.jpg";
import w1Anim from "@/assets/workout-1-anim.mp4.asset.json";
import w2Anim from "@/assets/workout-2-anim.mp4.asset.json";
import w3Anim from "@/assets/workout-3-anim.mp4.asset.json";

export interface ExerciseRec {
  name: string;
  sets: string;      // e.g. "4 sets"
  reps: string;      // e.g. "8–10 reps"
  cue: string;       // short form instruction
  image: string;
  video?: string;
  searchKey: string; // used to deep-link into /app/workouts
}

const DEMOS = [
  { image: workout1, video: w1Anim.url },
  { image: workout2, video: w2Anim.url },
  { image: workout3, video: w3Anim.url },
];

const rec = (
  name: string, sets: string, reps: string, cue: string, i: number, searchKey: string
): ExerciseRec => ({ name, sets, reps, cue, ...DEMOS[i % DEMOS.length], searchKey });

export const MUSCLE_EXERCISES: Record<string, ExerciseRec[]> = {
  chest: [
    rec("Barbell Bench Press", "4 sets", "8–10 reps", "Keep your shoulder blades pinned back and lower the bar under control.", 0, "bench"),
    rec("Incline Dumbbell Press", "3 sets", "10–12 reps", "Angle the bench to 30° and press through the mid-chest.", 1, "incline"),
    rec("Push-Ups", "3 sets", "to near failure", "Hands under shoulders, brace your core, full range every rep.", 2, "push"),
  ],
  shoulders: [
    rec("Standing Overhead Press", "4 sets", "6–8 reps", "Squeeze glutes, ribs down, drive the bar straight overhead.", 0, "press"),
    rec("Lateral Raise", "3 sets", "12–15 reps", "Lead with the elbows, pause at shoulder height.", 1, "raise"),
    rec("Rear Delt Fly", "3 sets", "12–15 reps", "Hinge forward, squeeze shoulder blades at the top.", 2, "delt"),
  ],
  biceps: [
    rec("Barbell Curl", "4 sets", "8–10 reps", "Elbows locked at your sides, no swinging.", 0, "curl"),
    rec("Incline Dumbbell Curl", "3 sets", "10–12 reps", "Full stretch at the bottom, controlled tempo.", 1, "curl"),
    rec("Hammer Curl", "3 sets", "10–12 reps", "Neutral grip, keep wrists straight and rigid.", 2, "curl"),
  ],
  forearms: [
    rec("Wrist Curl", "3 sets", "15–20 reps", "Forearms flat on the bench, roll the bar with your fingers.", 0, "wrist"),
    rec("Reverse Curl", "3 sets", "10–12 reps", "Overhand grip, curl slowly and control the negative.", 1, "curl"),
    rec("Farmer's Carry", "3 sets", "40m walks", "Stand tall, brace your core, crush the handles.", 2, "grip"),
  ],
  abs: [
    rec("Hanging Leg Raise", "3 sets", "10–12 reps", "Curl the pelvis up, no swinging from the bar.", 0, "abs"),
    rec("Cable Crunch", "3 sets", "12–15 reps", "Round the spine, drive elbows to knees.", 1, "crunch"),
    rec("Plank", "3 sets", "45–60 seconds", "Neutral spine, squeeze glutes, breathe through the ribs.", 2, "plank"),
  ],
  obliques: [
    rec("Russian Twist", "3 sets", "20 reps", "Tall chest, rotate from the ribs — not the arms.", 0, "twist"),
    rec("Side Plank", "3 sets", "30–45 seconds", "Stack the hips, drive them up towards the ceiling.", 1, "plank"),
    rec("Cable Woodchopper", "3 sets", "10 per side", "Pivot the back foot and rotate through the hips.", 2, "twist"),
  ],
  quads: [
    rec("Back Squat", "4 sets", "6–8 reps", "Braced core, knees track over toes, full depth.", 0, "squat"),
    rec("Bulgarian Split Squat", "3 sets", "10 per leg", "Front foot flat, drive up through the mid-foot.", 1, "lunge"),
    rec("Leg Extension", "3 sets", "12–15 reps", "Squeeze the quad hard at the top for one second.", 2, "leg"),
  ],
  calves_f: [
    rec("Standing Calf Raise", "4 sets", "12–15 reps", "Pause at the top, control the stretch at the bottom.", 0, "calf"),
    rec("Seated Calf Raise", "3 sets", "15–20 reps", "Full range — up on the ball of the foot.", 1, "calf"),
    rec("Jump Rope", "3 sets", "60 seconds", "Stay on the balls of the feet, light and springy.", 2, "calves"),
  ],
  traps: [
    rec("Barbell Shrug", "4 sets", "10–12 reps", "Lift straight up, pause and squeeze at the top.", 0, "shrug"),
    rec("Dumbbell Shrug", "3 sets", "12–15 reps", "Neutral neck, roll shoulders back — not forward.", 1, "shrug"),
    rec("Face Pull", "3 sets", "12–15 reps", "Pull to the forehead, elbows high, squeeze rear delts.", 2, "upper back"),
  ],
  rear_delts: [
    rec("Face Pull", "4 sets", "12–15 reps", "High elbows, pull the rope to your forehead.", 0, "face pull"),
    rec("Reverse Pec Deck", "3 sets", "12–15 reps", "Small arc, squeeze shoulder blades together.", 1, "reverse"),
    rec("Bent-Over Reverse Fly", "3 sets", "12–15 reps", "Hinge flat, lead with the pinkies.", 2, "rear delt"),
  ],
  lats: [
    rec("Pull-Up", "4 sets", "6–10 reps", "Full hang at the bottom, chest to the bar.", 0, "pull"),
    rec("Bent-Over Row", "4 sets", "8–10 reps", "Flat back, pull to the belly, control the negative.", 1, "row"),
    rec("Lat Pulldown", "3 sets", "10–12 reps", "Drive elbows down and back, squeeze the lats.", 2, "lat"),
  ],
  triceps: [
    rec("Close-Grip Bench Press", "4 sets", "8–10 reps", "Elbows tucked, bar to the lower chest.", 0, "bench"),
    rec("Rope Pushdown", "3 sets", "12–15 reps", "Split the rope at the bottom, lock out fully.", 1, "extension"),
    rec("Overhead Triceps Extension", "3 sets", "10–12 reps", "Keep elbows narrow, stretch behind the head.", 2, "tricep"),
  ],
  glutes: [
    rec("Barbell Hip Thrust", "4 sets", "8–10 reps", "Chin tucked, squeeze glutes hard at the top.", 0, "hip thrust"),
    rec("Romanian Deadlift", "3 sets", "8–10 reps", "Push hips back, feel the stretch in the hamstrings.", 1, "deadlift"),
    rec("Glute Bridge", "3 sets", "12–15 reps", "Drive through heels, pause one second at lockout.", 2, "bridge"),
  ],
  hamstrings: [
    rec("Romanian Deadlift", "4 sets", "8–10 reps", "Soft knees, hinge from the hips, bar close to legs.", 0, "deadlift"),
    rec("Lying Leg Curl", "3 sets", "10–12 reps", "Full range, squeeze at the top of every rep.", 1, "curl"),
    rec("Nordic Curl", "3 sets", "6–8 reps", "Lower under control, use hands to catch and reset.", 2, "hamstring"),
  ],
  calves_b: [
    rec("Standing Calf Raise", "4 sets", "12–15 reps", "Full stretch at the bottom, hard squeeze at the top.", 0, "calf"),
    rec("Seated Calf Raise", "3 sets", "15–20 reps", "Slow tempo — 2 seconds up, 2 seconds down.", 1, "calf"),
    rec("Single-Leg Calf Raise", "3 sets", "12 per leg", "Balance tall, full range every rep.", 2, "calves"),
  ],
};
