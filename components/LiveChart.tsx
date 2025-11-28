import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { HistoryPoint } from '../types';

interface LiveChartProps {
  data: HistoryPoint[];
}

const LiveChart: React.FC<LiveChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 h-[400px]">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Live Vitals Monitor</h2>
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#94a3b8' }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[40, 200]} 
              tick={{ fontSize: 12, fill: '#94a3b8' }} 
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="heartRate" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorHr)" 
              name="Heart Rate (BPM)"
              isAnimationActive={false} // Disable animation for smoother realtime updates
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiveChart;
