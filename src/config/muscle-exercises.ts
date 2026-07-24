/**
 * Curated 3-exercise recommendations for each muscle group used by the
 * Target Your Body page. Every exercise has its own unique looping AI-generated
 * demo clip (5s, 1:1) so the thumbnail matches the exercise title 100%.
 */
import workout1 from "@/assets/workout-1.jpg";
import workout2 from "@/assets/workout-2.jpg";
import workout3 from "@/assets/workout-3.jpg";

// Per-exercise animated demos
import benchPress from "@/assets/exercises/barbell-bench-press.mp4.asset.json";
import inclinePress from "@/assets/exercises/incline-dumbbell-press.mp4.asset.json";
import pushUps from "@/assets/exercises/push-ups.mp4.asset.json";
import overheadPress from "@/assets/exercises/standing-overhead-press.mp4.asset.json";
import lateralRaise from "@/assets/exercises/lateral-raise.mp4.asset.json";
import rearDeltFly from "@/assets/exercises/rear-delt-fly.mp4.asset.json";
import barbellCurl from "@/assets/exercises/barbell-curl.mp4.asset.json";
import inclineCurl from "@/assets/exercises/incline-dumbbell-curl.mp4.asset.json";
import hammerCurl from "@/assets/exercises/hammer-curl.mp4.asset.json";
import wristCurl from "@/assets/exercises/wrist-curl.mp4.asset.json";
import reverseCurl from "@/assets/exercises/reverse-curl.mp4.asset.json";
import farmersCarry from "@/assets/exercises/farmers-carry.mp4.asset.json";
import hangingLegRaise from "@/assets/exercises/hanging-leg-raise.mp4.asset.json";
import cableCrunch from "@/assets/exercises/cable-crunch.mp4.asset.json";
import plank from "@/assets/exercises/plank.mp4.asset.json";
import russianTwist from "@/assets/exercises/russian-twist.mp4.asset.json";
import sidePlank from "@/assets/exercises/side-plank.mp4.asset.json";
import woodchopper from "@/assets/exercises/cable-woodchopper.mp4.asset.json";
import backSquat from "@/assets/exercises/back-squat.mp4.asset.json";
import splitSquat from "@/assets/exercises/bulgarian-split-squat.mp4.asset.json";
import legExtension from "@/assets/exercises/leg-extension.mp4.asset.json";
import standingCalf from "@/assets/exercises/standing-calf-raise.mp4.asset.json";
import seatedCalf from "@/assets/exercises/seated-calf-raise.mp4.asset.json";
import jumpRope from "@/assets/exercises/jump-rope.mp4.asset.json";
import barbellShrug from "@/assets/exercises/barbell-shrug.mp4.asset.json";
import dumbbellShrug from "@/assets/exercises/dumbbell-shrug.mp4.asset.json";
import facePull from "@/assets/exercises/face-pull.mp4.asset.json";
import reversePecDeck from "@/assets/exercises/reverse-pec-deck.mp4.asset.json";
import bentOverFly from "@/assets/exercises/bent-over-reverse-fly.mp4.asset.json";
import pullUp from "@/assets/exercises/pull-up.mp4.asset.json";
import bentOverRow from "@/assets/exercises/bent-over-row.mp4.asset.json";
import latPulldown from "@/assets/exercises/lat-pulldown.mp4.asset.json";
import closeGripBench from "@/assets/exercises/close-grip-bench-press.mp4.asset.json";
import ropePushdown from "@/assets/exercises/rope-pushdown.mp4.asset.json";
import overheadTricep from "@/assets/exercises/overhead-triceps-extension.mp4.asset.json";
import hipThrust from "@/assets/exercises/barbell-hip-thrust.mp4.asset.json";
import rdl from "@/assets/exercises/romanian-deadlift.mp4.asset.json";
import gluteBridge from "@/assets/exercises/glute-bridge.mp4.asset.json";
import lyingLegCurl from "@/assets/exercises/lying-leg-curl.mp4.asset.json";
import nordicCurl from "@/assets/exercises/nordic-curl.mp4.asset.json";
import singleLegCalf from "@/assets/exercises/single-leg-calf-raise.mp4.asset.json";

export interface ExerciseRec {
  name: string;
  sets: string;
  reps: string;
  cue: string;
  image: string;
  video?: string;
  searchKey: string;
}

// Fallback still images cycle for the (very rare) case a clip fails to load.
const FALLBACK_IMAGES = [workout1, workout2, workout3];

const rec = (
  name: string,
  sets: string,
  reps: string,
  cue: string,
  video: { url: string },
  searchKey: string,
  imgIdx = 0,
): ExerciseRec => ({
  name,
  sets,
  reps,
  cue,
  video: video.url,
  image: FALLBACK_IMAGES[imgIdx % FALLBACK_IMAGES.length],
  searchKey,
});

export const MUSCLE_EXERCISES: Record<string, ExerciseRec[]> = {
  chest: [
    rec("Barbell Bench Press", "4 sets", "8–10 reps", "Keep your shoulder blades pinned back and lower the bar under control.", benchPress, "bench", 0),
    rec("Incline Dumbbell Press", "3 sets", "10–12 reps", "Angle the bench to 30° and press through the mid-chest.", inclinePress, "incline", 1),
    rec("Push-Ups", "3 sets", "to near failure", "Hands under shoulders, brace your core, full range every rep.", pushUps, "push", 2),
  ],
  shoulders: [
    rec("Standing Overhead Press", "4 sets", "6–8 reps", "Squeeze glutes, ribs down, drive the bar straight overhead.", overheadPress, "press", 0),
    rec("Lateral Raise", "3 sets", "12–15 reps", "Lead with the elbows, pause at shoulder height.", lateralRaise, "raise", 1),
    rec("Rear Delt Fly", "3 sets", "12–15 reps", "Hinge forward, squeeze shoulder blades at the top.", rearDeltFly, "delt", 2),
  ],
  biceps: [
    rec("Barbell Curl", "4 sets", "8–10 reps", "Elbows locked at your sides, no swinging.", barbellCurl, "curl", 0),
    rec("Incline Dumbbell Curl", "3 sets", "10–12 reps", "Full stretch at the bottom, controlled tempo.", inclineCurl, "curl", 1),
    rec("Hammer Curl", "3 sets", "10–12 reps", "Neutral grip, keep wrists straight and rigid.", hammerCurl, "curl", 2),
  ],
  forearms: [
    rec("Wrist Curl", "3 sets", "15–20 reps", "Forearms flat on the bench, roll the bar with your fingers.", wristCurl, "wrist", 0),
    rec("Reverse Curl", "3 sets", "10–12 reps", "Overhand grip, curl slowly and control the negative.", reverseCurl, "curl", 1),
    rec("Farmer's Carry", "3 sets", "40m walks", "Stand tall, brace your core, crush the handles.", farmersCarry, "grip", 2),
  ],
  abs: [
    rec("Hanging Leg Raise", "3 sets", "10–12 reps", "Curl the pelvis up, no swinging from the bar.", hangingLegRaise, "abs", 0),
    rec("Cable Crunch", "3 sets", "12–15 reps", "Round the spine, drive elbows to knees.", cableCrunch, "crunch", 1),
    rec("Plank", "3 sets", "45–60 seconds", "Neutral spine, squeeze glutes, breathe through the ribs.", plank, "plank", 2),
  ],
  obliques: [
    rec("Russian Twist", "3 sets", "20 reps", "Tall chest, rotate from the ribs — not the arms.", russianTwist, "twist", 0),
    rec("Side Plank", "3 sets", "30–45 seconds", "Stack the hips, drive them up towards the ceiling.", sidePlank, "plank", 1),
    rec("Cable Woodchopper", "3 sets", "10 per side", "Pivot the back foot and rotate through the hips.", woodchopper, "twist", 2),
  ],
  quads: [
    rec("Back Squat", "4 sets", "6–8 reps", "Braced core, knees track over toes, full depth.", backSquat, "squat", 0),
    rec("Bulgarian Split Squat", "3 sets", "10 per leg", "Front foot flat, drive up through the mid-foot.", splitSquat, "lunge", 1),
    rec("Leg Extension", "3 sets", "12–15 reps", "Squeeze the quad hard at the top for one second.", legExtension, "leg", 2),
  ],
  calves_f: [
    rec("Standing Calf Raise", "4 sets", "12–15 reps", "Pause at the top, control the stretch at the bottom.", standingCalf, "calf", 0),
    rec("Seated Calf Raise", "3 sets", "15–20 reps", "Full range — up on the ball of the foot.", seatedCalf, "calf", 1),
    rec("Jump Rope", "3 sets", "60 seconds", "Stay on the balls of the feet, light and springy.", jumpRope, "calves", 2),
  ],
  traps: [
    rec("Barbell Shrug", "4 sets", "10–12 reps", "Lift straight up, pause and squeeze at the top.", barbellShrug, "shrug", 0),
    rec("Dumbbell Shrug", "3 sets", "12–15 reps", "Neutral neck, roll shoulders back — not forward.", dumbbellShrug, "shrug", 1),
    rec("Face Pull", "3 sets", "12–15 reps", "Pull to the forehead, elbows high, squeeze rear delts.", facePull, "upper back", 2),
  ],
  rear_delts: [
    rec("Face Pull", "4 sets", "12–15 reps", "High elbows, pull the rope to your forehead.", facePull, "face pull", 0),
    rec("Reverse Pec Deck", "3 sets", "12–15 reps", "Small arc, squeeze shoulder blades together.", reversePecDeck, "reverse", 1),
    rec("Bent-Over Reverse Fly", "3 sets", "12–15 reps", "Hinge flat, lead with the pinkies.", bentOverFly, "rear delt", 2),
  ],
  lats: [
    rec("Pull-Up", "4 sets", "6–10 reps", "Full hang at the bottom, chest to the bar.", pullUp, "pull", 0),
    rec("Bent-Over Row", "4 sets", "8–10 reps", "Flat back, pull to the belly, control the negative.", bentOverRow, "row", 1),
    rec("Lat Pulldown", "3 sets", "10–12 reps", "Drive elbows down and back, squeeze the lats.", latPulldown, "lat", 2),
  ],
  triceps: [
    rec("Close-Grip Bench Press", "4 sets", "8–10 reps", "Elbows tucked, bar to the lower chest.", closeGripBench, "bench", 0),
    rec("Rope Pushdown", "3 sets", "12–15 reps", "Split the rope at the bottom, lock out fully.", ropePushdown, "extension", 1),
    rec("Overhead Triceps Extension", "3 sets", "10–12 reps", "Keep elbows narrow, stretch behind the head.", overheadTricep, "tricep", 2),
  ],
  glutes: [
    rec("Barbell Hip Thrust", "4 sets", "8–10 reps", "Chin tucked, squeeze glutes hard at the top.", hipThrust, "hip thrust", 0),
    rec("Romanian Deadlift", "3 sets", "8–10 reps", "Push hips back, feel the stretch in the hamstrings.", rdl, "deadlift", 1),
    rec("Glute Bridge", "3 sets", "12–15 reps", "Drive through heels, pause one second at lockout.", gluteBridge, "bridge", 2),
  ],
  hamstrings: [
    rec("Romanian Deadlift", "4 sets", "8–10 reps", "Soft knees, hinge from the hips, bar close to legs.", rdl, "deadlift", 0),
    rec("Lying Leg Curl", "3 sets", "10–12 reps", "Full range, squeeze at the top of every rep.", lyingLegCurl, "curl", 1),
    rec("Nordic Curl", "3 sets", "6–8 reps", "Lower under control, use hands to catch and reset.", nordicCurl, "hamstring", 2),
  ],
  calves_b: [
    rec("Standing Calf Raise", "4 sets", "12–15 reps", "Full stretch at the bottom, hard squeeze at the top.", standingCalf, "calf", 0),
    rec("Seated Calf Raise", "3 sets", "15–20 reps", "Slow tempo — 2 seconds up, 2 seconds down.", seatedCalf, "calf", 1),
    rec("Single-Leg Calf Raise", "3 sets", "12 per leg", "Balance tall, full range every rep.", singleLegCalf, "calves", 2),
  ],
};
