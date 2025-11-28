import React, { useState } from 'react';
import { Settings, Usb, RefreshCw, Link, Unlink, CircleHelp, Cpu, Cable, Download, AlertTriangle } from 'lucide-react';

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
  isAnalyzing
}) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Settings size={20} className="text-slate-500" />
          Device Control
        </h2>
        {isConnected ? (
           <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
             <Usb size={14} /> Connected
           </span>
        ) : (
           <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-semibold">
             <Unlink size={14} /> Disconnected
           </span>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <Usb size={32} className="text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-medium">Device not connected</p>
            <p className="text-xs text-slate-500 mt-1">Connect your ESP32 via USB to start monitoring</p>
          </div>
          <button
            onClick={onConnect}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Link size={16} />
            Connect Device
          </button>
          
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-2 underline decoration-dotted"
          >
            <CircleHelp size={14} />
            {showGuide ? "Hide Setup Guide" : "How to connect?"}
          </button>
          
          {showGuide && (
            <div className="mt-4 w-full text-left bg-white border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-3 animate-in fade-in slide-in-from-top-2">
              
              <div className="border-b border-slate-100 pb-2 mb-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Download size={14} className="text-indigo-500" /> 1. Install CP210x Driver
                </h4>
                <div className="bg-amber-50 border border-amber-100 p-2 rounded text-amber-800 mb-2">
                   <p className="font-semibold flex items-center gap-1"><AlertTriangle size={12}/> Critical Step:</p>
                   You must <strong>Unzip</strong> the downloaded file and run the installer (e.g., <code>CP210xVCPInstaller_x64.exe</code>). Merely downloading it is not enough.
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
              
              <div className="border-t border-slate-100 pt-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Cpu size={14} className="text-indigo-500" /> 3. Connect to App
                </h4>
                <ol className="list-decimal pl-5 space-y-0.5">
                  <li>Plug ESP32 into USB.</li>
                  <li>Click the blue <strong>Connect Device</strong> button above.</li>
                  <li>A popup will appear. Select the port named <strong>"CP210x USB to UART Bridge"</strong>.</li>
                  <li>Click <strong>Connect</strong> in the popup.</li>
                </ol>
              </div>
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

          {/* SpO2 Manual Override (Since code provided doesn't output it) */}
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