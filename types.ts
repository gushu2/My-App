export enum StressLevel {
  Normal = "Normal",
  MildStress = "Mild Stress",
  HighStress = "High Stress",
  Unknown = "Unknown",
  NoData = "No Data"
}

export interface SensorData {
  timestamp: number;
  heartRate: number;
  spo2: number;
}

export interface AnalysisResult {
  stressLevel: string;
  reason: string;
  suggestion: string;
}

export interface HistoryPoint {
  time: string;
  heartRate: number;
  spo2: number;
}