import React, { useState } from 'react';
import { Settings, Usb, RefreshCw, Link, Unlink, CircleHelp, Cpu, Cable, Download, AlertTriangle, Wifi, Copy, Check } from 'lucide-react';

interface SensorControlProps {
  heartRate: number;
  spo2: number;
  isConnected: boolean;
  onHeartRateChange: (val: number) => void;
  onSpo2Change: (val: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  connectionMode: 'USB' | 'WIFI';
  setConnectionMode: (mode: 'USB' | 'WIFI') => void;
  ipAddress: string;
  setIpAddress: (ip: string) => void;
}

const SensorControl: React.FC<SensorControlProps> = ({
  heartRate,
  spo2,
  isConnected,
  onHeartRateChange,
  onSpo2Change,
  onConnect,
  onDisconnect,
  onAnalyze,
  isAnalyzing,
  connectionMode,
  setConnectionMode,
  ipAddress,
  setIpAddress
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const code = `#include <WiFi.h>
#include <WebSocketsServer.h> // Install "WebSockets" by Markus Sattler
#include "MAX30100_PulseOximeter.h"

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

PulseOximeter pox;
WebSocketsServer webSocket = WebSocketsServer(81);
uint32_t tsLastReport = 0;

void setup() {
  Serial.begin(115200);
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Start WebSocket
  webSocket.begin();
  
  // Init Sensor
  if (!pox.begin()) {
    Serial.println("FAILED");
  } else {
    Serial.println("SUCCESS");
  }
}

void loop() {
  webSocket.loop();
  pox.update();

  if (millis() - tsLastReport > 1000) {
    float hr = pox.getHeartRate();
    
    // Send data to App
    String data = "Heart rate: " + String(hr);
    webSocket.broadcastTXT(data);
    
    tsLastReport = millis();
  }
}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Settings size={20} className="text-slate-500" />
          Device Control
        </h2>
        {isConnected ? (
           <span className={`flex items-center gap-1.5 px-2 py-1 ${connectionMode === 'WIFI' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'} rounded text-xs font-semibold`}>
             {connectionMode === 'WIFI' ? <Wifi size={14} /> : <Usb size={14} />} 
             Connected
           </span>
        ) : (
           <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-semibold">
             <Unlink size={14} /> Disconnected
           </span>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          
          {/* Connection Mode Toggle */}
          <div className="flex bg-slate-200 p-1 rounded-lg w-full max-w-[240px] mb-2">
            <button
              onClick={() => setConnectionMode('USB')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                connectionMode === 'USB' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Usb size={14} /> USB Cable
            </button>
            <button
              onClick={() => setConnectionMode('WIFI')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                connectionMode === 'WIFI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Wifi size={14} /> Wi-Fi
            </button>
          </div>

          <div className="p-3 bg-white rounded-full shadow-sm">
            {connectionMode === 'USB' ? (
              <Usb size={32} className="text-slate-400" />
            ) : (
              <Wifi size={32} className="text-indigo-400" />
            )}
          </div>
          
          <div>
            <p className="text-slate-700 font-medium">
              {connectionMode === 'USB' ? 'Device not connected' : 'Enter ESP32 IP Address'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {connectionMode === 'USB' 
                ? 'Connect your ESP32 via USB to start monitoring' 
                : 'Enter the IP shown in Arduino Serial Monitor'}
            </p>
          </div>

          {connectionMode === 'WIFI' && (
            <input 
              type="text" 
              placeholder="e.g. 192.168.1.45"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full max-w-[240px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
            />
          )}

          <button
            onClick={onConnect}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Link size={16} />
            {connectionMode === 'USB' ? 'Connect via USB' : 'Connect via Wi-Fi'}
          </button>
          
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-2 underline decoration-dotted"
          >
            <CircleHelp size={14} />
            {showGuide ? "Hide Setup Guide" : "How to connect?"}
          </button>
          
          {showGuide && (
            <div className="mt-4 w-full text-left bg-white border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-3 animate-in fade-in slide-in-from-top-2 max-h-[400px] overflow-y-auto">
              
              {connectionMode === 'USB' ? (
                /* USB GUIDE */
                <>
                  <div className="border-b border-slate-100 pb-2 mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <Download size={14} className="text-indigo-500" /> 1. Install CP210x Driver
                    </h4>
                    <div className="bg-amber-50 border border-amber-100 p-2 rounded text-amber-800 mb-2">
                      <p className="font-semibold flex items-center gap-1"><AlertTriangle size={12}/> Critical Step:</p>
                      You must <strong>Unzip</strong> the downloaded file and run the installer (e.g., <code>CP210xVCPInstaller_x64.exe</code>).
                    </div>
                    <a 
                      href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-indigo-600 underline hover:text-indigo-800 font-medium"
                    >
                      Download Driver Here
                    </a>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <Cable size={14} className="text-indigo-500" /> 2. Hardware Wiring
                    </h4>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li><strong>MAX30100:</strong> SDA &rarr; GPIO 21, SCL &rarr; GPIO 22</li>
                      <li><strong>Green LED:</strong> GPIO 18</li>
                      <li><strong>Yellow LED:</strong> GPIO 19</li>
                      <li><strong>Red LED:</strong> GPIO 23</li>
                    </ul>
                  </div>
                </>
              ) : (
                /* WIFI GUIDE */
                <>
                  <div className="border-b border-slate-100 pb-2 mb-2">
                     <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <Cpu size={14} className="text-indigo-500" /> 1. Flash Wi-Fi Code
                    </h4>
                    <p className="mb-2">Upload this code to your ESP32. You need the <code>WebSockets</code> library by Markus Sattler.</p>
                    
                    <div className="relative group">
                      <pre className="bg-slate-900 text-slate-50 p-3 rounded-md overflow-x-auto font-mono text-[10px] leading-tight max-h-[150px]">
{`#include <WiFi.h>
#include <WebSocketsServer.h>
#include "MAX30100_PulseOximeter.h"

// REPLACE THESE
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PWD";

PulseOximeter pox;
WebSocketsServer webSocket = WebSocketsServer(81);
uint32_t tsLastReport = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.println(WiFi.localIP()); // COPY THIS IP
  webSocket.begin();
  if(!pox.begin()) Serial.println("FAIL");
}

void loop() {
  webSocket.loop();
  pox.update();
  if (millis() - tsLastReport > 1000) {
    webSocket.broadcastTXT("Heart rate: " + String(pox.getHeartRate()));
    tsLastReport = millis();
  }
}`}
                      </pre>
                      <button 
                        onClick={copyCode}
                        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                        title="Copy Code"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <Wifi size={14} className="text-indigo-500" /> 2. Connect
                    </h4>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Open Serial Monitor (115200 baud) to see the <strong>IP Address</strong>.</li>
                      <li>Enter that IP in the box above.</li>
                      <li>Ensure your computer is on the <strong>same Wi-Fi network</strong>.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Data Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
               <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Heart Rate</span>
               <div className="flex items-baseline mt-1">
                 <span className={`text-3xl font-bold ${heartRate > 120 ? 'text-red-500' : 'text-slate-800'}`}>
                   {heartRate > 0 ? heartRate : '--'}
                 </span>
                 <span className="text-xs text-slate-400 ml-1">BPM</span>
               </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
               <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">SpO2</span>
               <div className="flex items-baseline mt-1">
                 <span className="text-3xl font-bold text-slate-800">
                   {heartRate > 0 ? spo2 : '--'}
                 </span>
                 <span className="text-xs text-slate-400 ml-1">%</span>
               </div>
            </div>
          </div>

          {/* SpO2 Manual Override */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-slate-500">SpO2 Calibration (%)</label>
              <span className="text-xs font-bold text-slate-700">{spo2}</span>
            </div>
            <input
              type="range"
              min="80"
              max="100"
              value={spo2}
              onChange={(e) => onSpo2Change(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex gap-3">
             <button
               onClick={onDisconnect}
               className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
             >
               Disconnect
             </button>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100">
        <button
          onClick={onAnalyze}
          disabled={!isConnected || isAnalyzing || heartRate === 0}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Current Readings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SensorControl;