import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Gemini AI
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Generate fitness plan
app.post("/api/generate-plan", async (req, res) => {
    try {
        const {
            name,
            age,
            gender,
            height,
            weight,
            goal,
            activityLevel,
            experience,
            availableTime
        } = req.body;

        const prompt = `
You are FitBuddy, an AI fitness planning assistant.

Create a simple and personalized fitness plan based on the following information:

Name: ${name}
Age: ${age}
Gender: ${gender}
Height: ${height} cm
Weight: ${weight} kg
Fitness Goal: ${goal}
Activity Level: ${activityLevel}
Fitness Experience: ${experience}
Available Workout Time: ${availableTime} minutes per day

Provide:

1. A short fitness summary
2. A 7-day workout schedule
3. Exercises for each day
4. Sets and repetitions where appropriate
5. Rest/recovery suggestions
6. General healthy eating suggestions
7. Hydration tips
8. A short motivational message

Keep the plan beginner-friendly, practical and easy to understand.

Do not diagnose medical conditions or provide medical treatment.
If the user has a medical condition or injury, advise them to consult a qualified healthcare professional.
`;

        let plan;
        let aiWorked = false;

        // Try Gemini first
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash-lite",
                contents: prompt
            });

            plan = response.text;
            aiWorked = true;

        } catch (geminiError) {
            console.log(
                "Gemini temporarily unavailable. Using FitBuddy fallback plan."
            );
        }

        // Personalized fallback if Gemini is unavailable
        if (!aiWorked) {

            let workoutFocus = "";
            let intensity = "";

            if (goal === "Weight Loss" || goal === "weight loss") {
                workoutFocus =
                    "cardio, full-body strength training and regular movement";
            } else if (goal === "Muscle Gain" || goal === "muscle gain") {
                workoutFocus =
                    "strength training with gradual progression and adequate recovery";
            } else if (goal === "General Fitness" || goal === "general fitness") {
                workoutFocus =
                    "full-body strength, cardio, mobility and consistency";
            } else {
                workoutFocus =
                    "balanced strength training, cardio and mobility";
            }

            if (
                experience === "Beginner" ||
                experience === "beginner"
            ) {
                intensity = "beginner-friendly";
            } else if (
                experience === "Intermediate" ||
                experience === "intermediate"
            ) {
                intensity = "moderate";
            } else {
                intensity = "progressive";
            }

            plan = `
FITBUDDY PERSONALIZED FITNESS PLAN

Hello ${name || "there"}! 👋

YOUR PROFILE
Age: ${age}
Gender: ${gender}
Height: ${height} cm
Weight: ${weight} kg
Goal: ${goal}
Activity Level: ${activityLevel}
Experience: ${experience}
Available Time: ${availableTime} minutes per day

FITNESS SUMMARY
Your plan is designed around your goal of ${goal}.
The main focus is ${workoutFocus}.
Because your experience level is ${experience}, the workouts are ${intensity}
and designed to fit within approximately ${availableTime} minutes.

7-DAY WORKOUT PLAN

DAY 1 — FULL BODY
• Warm-up: 5 minutes
• Bodyweight squats: 3 sets × 10 reps
• Wall or knee push-ups: 3 sets × 8 reps
• Glute bridges: 3 sets × 12 reps
• Marching in place: 5 minutes
• Cool-down: 5 minutes

DAY 2 — CARDIO & MOBILITY
• Warm-up: 5 minutes
• Brisk walking or light jogging: 15–20 minutes
• Standing knee raises: 3 sets × 10 reps
• Gentle stretching: 5–10 minutes

DAY 3 — LOWER BODY
• Warm-up: 5 minutes
• Squats: 3 sets × 10 reps
• Reverse lunges: 2 sets × 8 reps per leg
• Glute bridges: 3 sets × 12 reps
• Calf raises: 3 sets × 12 reps
• Cool-down: 5 minutes

DAY 4 — ACTIVE RECOVERY
• Easy walking: 15–20 minutes
• Gentle full-body stretching: 10 minutes
• Focus on recovery and good sleep.

DAY 5 — UPPER BODY & CORE
• Warm-up: 5 minutes
• Wall or knee push-ups: 3 sets × 8 reps
• Shoulder taps: 2 sets × 10 reps
• Bird-dog: 3 sets × 8 reps per side
• Plank: 2 sets of 15–30 seconds
• Cool-down: 5 minutes

DAY 6 — FULL BODY CARDIO
• Warm-up: 5 minutes
• Brisk walking: 10 minutes
• Squats: 3 sets × 10 reps
• Marching in place: 5 minutes
• Glute bridges: 3 sets × 12 reps
• Cool-down: 5 minutes

DAY 7 — REST & RECOVERY
• Rest from structured exercise.
• Optional easy walk.
• Gentle stretching if comfortable.
• Prepare for the next week.

REST & RECOVERY
• Take rest periods between sets.
• Increase difficulty gradually rather than suddenly.
• Aim for consistent sleep and recovery.
• Stop an exercise if it causes pain.

HEALTHY EATING SUGGESTIONS
• Include vegetables and fruits regularly.
• Choose protein-rich foods such as eggs, beans, lentils,
  dairy, fish or lean meat according to your preferences.
• Include whole grains and other nutritious carbohydrate sources.
• Limit highly processed foods and excess added sugar.
• Eat regular balanced meals.

HYDRATION
Drink water regularly throughout the day and especially around exercise.
Individual fluid needs vary depending on activity and environment.

MOTIVATION
Small, consistent steps matter more than trying to be perfect.
Stay consistent, listen to your body and celebrate your progress. 💪

Note: This is general fitness information, not medical advice.
If you have an injury, medical condition, or concerns about exercising,
consult a qualified healthcare professional before starting a new program.
`;
        }

        res.json({
            success: true,
            plan: plan,
            aiGenerated: aiWorked
        });

    } catch (error) {
        console.error("FitBuddy Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to generate fitness plan.",
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`FitBuddy server running at http://localhost:${PORT}`);
});