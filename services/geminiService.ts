import { AnalysisResult, StressLevel } from "../types";

// Local suggestions database to provide varied feedback
const SUGGESTIONS = {
  [StressLevel.Normal]: [
    "Maintain calm breathing and continue your routine.",
    "Your vitals are stable. Keep up the good work.",
    "Relaxed state detected. Perfect for focused tasks."
  ],
  [StressLevel.MildStress]: [
    "Take slow deep breaths for 30 seconds.",
    "Consider a quick stretching break to release tension.",
    "Drink some water and lower your shoulders.",
    "Try a 4-7-8 breathing exercise."
  ],
  [StressLevel.HighStress]: [
    "Pause your activity immediately and rest.",
    "Deep slow breathing is recommended to lower heart rate.",
    "Take a short walk or step away from the current task.",
    "Focus on exhaling longer than you inhale."
  ],
  [StressLevel.NoData]: [
    "Reconnect the device and try again.",
    "Check the wiring and power supply of the ESP32.",
    "Ensure the sensor is properly placed on the finger."
  ]
};

const getRandomSuggestion = (level: StressLevel): string => {
  const options = SUGGESTIONS[level] || SUGGESTIONS[StressLevel.Normal];
  return options[Math.floor(Math.random() * options.length)];
};

export const analyzeSensorData = async (heartRate: number, spo2: number): Promise<AnalysisResult> => {
  // Simulate a brief calculation delay for realistic system feedback
  await new Promise(resolve => setTimeout(resolve, 600));

  // Logic implementing the NeuroCalm requirements locally (matching ESP32 thresholds)
  
  // Check for invalid or missing data
  if (!heartRate || heartRate <= 0) {
    return {
        stressLevel: StressLevel.NoData,
        reason: "Arduino/ESP32 not connected or sensor data invalid.",
        suggestion: getRandomSuggestion(StressLevel.NoData)
    };
  }

  // Rule: heartRate < 80 → "Normal"
  if (heartRate < 80) {
      return {
          stressLevel: StressLevel.Normal,
          reason: `Heart rate (${heartRate} BPM) is within the normal resting range.`,
          suggestion: getRandomSuggestion(StressLevel.Normal)
      };
  }
  
  // Rule: 80 to 120 → "Mild Stress"
  if (heartRate >= 80 && heartRate <= 120) {
      return {
          stressLevel: StressLevel.MildStress,
          reason: `Heart rate is moderately elevated (${heartRate} BPM).`,
          suggestion: getRandomSuggestion(StressLevel.MildStress)
      };
  }

  // Rule: > 120 → "High Stress"
  return {
      stressLevel: StressLevel.HighStress,
      reason: `Heart rate is significantly high (${heartRate} BPM) indicating stress.`,
      suggestion: getRandomSuggestion(StressLevel.HighStress)
  };
};