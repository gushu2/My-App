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
  const [spo2, setSpo2] = useState<number>(98); // Default
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Connection State
  const [connectionMode, setConnectionMode] = useState<'USB' | 'WIFI'>('USB');
  const [ipAddress, setIpAddress] = useState<string>('');
  
  // History for Chart
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // References
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Initialize graph data
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

    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Main Connect Handler
  const handleConnect = () => {
    if (connectionMode === 'USB') {
      connectToSerial();
    } else {
      connectToWifi();
    }
  };

  // ------------------ USB SERIAL LOGIC ------------------
  const connectToSerial = async () => {
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
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.log("User cancelled port selection.");
        return;
      }
      console.error("Connection failed:", error);
      setIsConnected(false);
      alert(`Connection failed: ${error.message || 'Unknown error'}`);
    }
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
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          for (const line of lines) {
             processDataLine(line);
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

  // ------------------ WI-FI WEBSOCKET LOGIC ------------------
  const connectToWifi = () => {
    if (!ipAddress) {
      alert("Please enter the ESP32 IP Address");
      return;
    }
    
    // Add ws:// prefix if missing
    let url = ipAddress;
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        url = `ws://${url}:81`; // Defaulting to port 81 per common WebSockets library defaults
    }

    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket Connected");
      };

      ws.onmessage = (event) => {
        processDataLine(event.data);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket Disconnected");
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        alert("WebSocket connection failed. Check IP address and ensure ESP32 is powered on.");
        setIsConnected(false);
      };

      websocketRef.current = ws;
    } catch (e) {
      alert("Invalid IP Address or Connection Error");
    }
  };

  // ------------------ COMMON DISCONNECT ------------------
  const handleDisconnect = async () => {
    // Disconnect Serial
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) { console.error(e); }
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) { console.error(e); }
      portRef.current = null;
    }

    // Disconnect WebSocket
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setIsConnected(false);
    setHeartRate(0); 
  };

  // ------------------ DATA PROCESSING ------------------
  const processDataLine = (line: string) => {
    // Expected format: "Heart rate: 75.00"
    const trimmed = line.trim();
    const hrMatch = trimmed.match(/Heart rate:\s*([\d.]+)/);
    
    if (hrMatch && hrMatch[1]) {
      const newHr = parseFloat(hrMatch[1]);
      if (!isNaN(newHr)) {
        setHeartRate(Math.round(newHr));
        updateHistory(Math.round(newHr));
      }
    }
  };

  const updateHistory = (newHr: number) => {
    setHistory(prev => {
      const newPoint: HistoryPoint = {
        time: new Date().toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' }),
        heartRate: newHr,
        spo2: spo2 
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
      <Header 
        onInstall={handleInstallClick} 
        canInstall={!!deferredPrompt} 
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <LiveChart data={history} />
            <div className="block lg:hidden">
              <SensorControl
                heartRate={heartRate}
                spo2={spo2}
                isConnected={isConnected}
                onHeartRateChange={setHeartRate}
                onSpo2Change={setSpo2}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                connectionMode={connectionMode}
                setConnectionMode={setConnectionMode}
                ipAddress={ipAddress}
                setIpAddress={setIpAddress}
              />
            </div>
            
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-2">System Overview</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                    NeuroCalm processes real-time sensor data from the connected Arduino/ESP32 device. 
                    Connect your device via USB Serial or Wi-Fi (WebSocket). The system reads the raw data stream 
                    ("Heart rate: xx") and applies algorithmic stress classification.
                </p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="hidden lg:block">
              <SensorControl
                heartRate={heartRate}
                spo2={spo2}
                isConnected={isConnected}
                onHeartRateChange={setHeartRate}
                onSpo2Change={setSpo2}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                connectionMode={connectionMode}
                setConnectionMode={setConnectionMode}
                ipAddress={ipAddress}
                setIpAddress={setIpAddress}
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
               <span>v1.2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;