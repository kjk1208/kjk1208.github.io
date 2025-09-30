import React from 'react';

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  isBreak: boolean;
}

export default React.memo(function CircularTimer({ timeLeft, totalTime, isActive, isBreak }: CircularTimerProps) {
  const progress = React.useMemo(() => ((totalTime - timeLeft) / totalTime) * 100, [totalTime, timeLeft]);
  const circumference = React.useMemo(() => 2 * Math.PI * 120, []); // radius = 120
  const strokeDashoffset = React.useMemo(() => circumference - (progress / 100) * circumference, [circumference, progress]);
  
  const formatTime = React.useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Background circle */}
      <svg className="w-80 h-80 transform -rotate-90" width="320" height="320">
        <circle
          cx="160"
          cy="160"
          r="120"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted-foreground/20"
        />
        
        {/* Progress circle */}
        <circle
          cx="160"
          cy="160"
          r="120"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-linear ${
            isBreak 
              ? 'text-blue-500' 
              : 'text-red-500'
          }`}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-6xl font-bold transition-colors ${
          isBreak ? 'text-blue-500' : 'text-red-500'
        }`}>
          {formatTime(timeLeft)}
        </div>
        
        {/* Timer state indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isActive 
              ? (isBreak ? 'bg-blue-500 animate-pulse' : 'bg-red-500 animate-pulse')
              : 'bg-muted-foreground'
          }`}></div>
          <span className="text-sm text-muted-foreground">
            {isActive ? (isBreak ? '휴식 중' : '집중 중') : '정지됨'}
          </span>
        </div>
        
        {/* Progress percentage */}
        <div className="mt-2 text-sm text-muted-foreground">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Hour markers */}
      {React.useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30) - 90; // -90 to start from top
        const radian = (angle * Math.PI) / 180;
        const x = 160 + 140 * Math.cos(radian);
        const y = 160 + 140 * Math.sin(radian);
        
        return (
          <div
            key={i}
            className="absolute w-1 h-6 bg-muted-foreground/40"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
              transformOrigin: 'center'
            }}
          />
        );
      }), [])}
    </div>
  );
});