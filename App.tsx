import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import SensorControl from './components/SensorControl';
import LiveChart from './components/LiveChart';
import AnalysisCard from './components/AnalysisCard';
import { analyzeSensorData } from './services/geminiService';
import { AnalysisResult, HistoryPoint, StressLevel } from './types';
import { GRAPH_HISTORY_LENGTH } from './constants';

const App: React.FC = () => {
  // Sensor State
  const [heartRate, setHeartRate] = useState<number>(0);
  const [spo2, setSpo2] = useState<number>(98); // Default as ESP32 code provided doesn't output SpO2
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // History for Chart
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Serial Port Reference
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  // Initialize graph data with empty/zero values
  useEffect(() => {
    const initialData: HistoryPoint[] = [];
    const now = new Date();
    for (let i = GRAPH_HISTORY_LENGTH; i > 0; i--) {
      initialData.push({
        time: new Date(now.getTime() - i * 1000).toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' }),
        heartRate: 0,
        spo2: 0
      });
    }
    setHistory(initialData);
  }, []);

  // Serial Connection Logic
  const connectToDevice = async () => {
    if (!('serial' in navigator)) {
      alert("Your browser does not support the Web Serial API. Please use Chrome, Edge, or Opera.");
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsConnected(true);
      readSerialLoop(port);
    } catch (error) {
      console.error("Connection failed:", error);
      setIsConnected(false);
    }
  };

  const disconnectDevice = async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.error("Error canceling reader", e);
      }
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        console.error("Error closing port", e);
      }
      portRef.current = null;
    }
    setIsConnected(false);
    setHeartRate(0); // Reset readings
  };

  const readSerialLoop = async (port: any) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // Allow the serial port to be closed later.
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          // Keep the last partial line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
             parseSerialData(line);
          }
        }
      }
    } catch (error) {
      console.error("Read error:", error);
    } finally {
      reader.releaseLock();
      setIsConnected(false);
    }
  };

  const parseSerialData = (line: string) => {
    // Expected format from ESP32 code: "Heart rate: 75.00"
    const trimmed = line.trim();
    
    // Regex to match "Heart rate: <number>"
    const hrMatch = trimmed.match(/Heart rate:\s*([\d.]+)/);
    
    if (hrMatch && hrMatch[1]) {
      const newHr = parseFloat(hrMatch[1]);
      if (!isNaN(newHr)) {
        setHeartRate(Math.round(newHr));
        
        // Since ESP32 code provided doesn't give SpO2, we use the manual slider value or default
        // We trigger an update to the history here
        updateHistory(Math.round(newHr));
      }
    } else if (trimmed === "Beat!") {
      // Optional: Could flash an indicator
    }
  };

  const updateHistory = (newHr: number) => {
    setHistory(prev => {
      const newPoint: HistoryPoint = {
        time: new Date().toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' }),
        heartRate: newHr,
        spo2: spo2 // Use current state spo2
      };
      const newHistory = [...prev, newPoint];
      if (newHistory.length > GRAPH_HISTORY_LENGTH) {
        return newHistory.slice(newHistory.length - GRAPH_HISTORY_LENGTH);
      }
      return newHistory;
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // If not connected, force No Data result
      if (!isConnected || heartRate === 0) {
         setAnalysis({
             stressLevel: StressLevel.NoData,
             reason: "Device disconnected or no heartbeat detected.",
             suggestion: "Please connect the ESP32 device and ensure sensor placement."
         });
         setIsAnalyzing(false);
         return;
      }
      const result = await analyzeSensorData(heartRate, spo2);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Sensor & Chart */}
          <div className="lg:col-span-8 space-y-8">
            <LiveChart data={history} />
            <div className="block lg:hidden">
              <SensorControl
                heartRate={heartRate}
                spo2={spo2}
                isConnected={isConnected}
                onHeartRateChange={setHeartRate}
                onSpo2Change={setSpo2}
                onConnect={connectToDevice}
                onDisconnect={disconnectDevice}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            </div>
            
            {/* Desktop-only explanation section */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-2">System Overview</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                    NeuroCalm processes real-time sensor data from the connected Arduino/ESP32 device. 
                    Connect your device via USB to start monitoring. The system reads the raw serial stream 
                    ("Heart rate: xx") and applies algorithmic stress classification.
                </p>
            </div>
          </div>

          {/* Right Column: Controls & Analysis */}
          <div className="lg:col-span-4 space-y-8">
            <div className="hidden lg:block">
              <SensorControl
                heartRate={heartRate}
                spo2={spo2}
                isConnected={isConnected}
                onHeartRateChange={setHeartRate}
                onSpo2Change={setSpo2}
                onConnect={connectToDevice}
                onDisconnect={disconnectDevice}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            </div>
            
            <div className="h-[400px]">
               <AnalysisCard result={analysis} loading={isAnalyzing} />
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold text-slate-800">Tech Titans</p>
              <p className="text-xs text-slate-500 mt-1">&copy; {new Date().getFullYear()} Tech Titans. All Rights Reserved.</p>
            </div>
            <div className="flex gap-6 text-xs text-slate-400 font-medium">
               <span className="hover:text-slate-600 cursor-pointer transition-colors">Privacy Policy</span>
               <span className="hover:text-slate-600 cursor-pointer transition-colors">Terms of Service</span>
               <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;