import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import CircularTimer from './CircularTimer';
import { Play, Pause, RotateCcw, Settings, Timer, Coffee, BarChart3, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PomodoroSession {
  id: string;
  date: string;
  focusTime: number;
  breakTime: number;
  completedSessions: number;
  totalFocusMinutes: number;
}

interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
}

export default function PomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings>({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsUntilLongBreak: 4
  });

  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(settings.focusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('pomodoroSessions');
    const savedSettings = localStorage.getItem('pomodoroSettings');
    
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTimeLeft(parsed.focusMinutes * 60);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const saveSessions = (updatedSessions: PomodoroSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('pomodoroSessions', JSON.stringify(updatedSessions));
  };

  const saveSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
  };

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (!isBreak) {
      // Focus session completed
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Save session data
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingSession = sessions.find(s => s.date === today);
      
      if (existingSession) {
        const updatedSessions = sessions.map(s => 
          s.date === today 
            ? { 
                ...s, 
                completedSessions: s.completedSessions + 1,
                totalFocusMinutes: s.totalFocusMinutes + settings.focusMinutes
              }
            : s
        );
        saveSessions(updatedSessions);
      } else {
        const newSession: PomodoroSession = {
          id: Date.now().toString(),
          date: today,
          focusTime: settings.focusMinutes,
          breakTime: settings.shortBreakMinutes,
          completedSessions: 1,
          totalFocusMinutes: settings.focusMinutes
        };
        saveSessions([newSession, ...sessions]);
      }
      
      // Start break
      setIsBreak(true);
      const isLongBreak = newCompletedSessions % settings.sessionsUntilLongBreak === 0;
      setTimeLeft((isLongBreak ? settings.longBreakMinutes : settings.shortBreakMinutes) * 60);
    } else {
      // Break completed, start new focus session
      setIsBreak(false);
      setTimeLeft(settings.focusMinutes * 60);
    }

    // Play notification sound (mock)
    console.log('Timer completed!');
  };

  const startTimer = () => {
    setIsActive(true);
    if (!currentSessionStart && !isBreak) {
      setCurrentSessionStart(new Date());
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(settings.focusMinutes * 60);
    setCurrentSessionStart(null);
  };

  const getTotalTime = () => {
    return isBreak 
      ? (completedSessions % settings.sessionsUntilLongBreak === 0 ? settings.longBreakMinutes : settings.shortBreakMinutes) * 60
      : settings.focusMinutes * 60;
  };

  const getTodayStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySession = sessions.find(s => s.date === today);
    return todaySession || { completedSessions: 0, totalFocusMinutes: 0 };
  };

  const getWeeklyStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return sessions
      .filter(s => new Date(s.date) >= weekAgo)
      .reduce((acc, session) => ({
        sessions: acc.sessions + session.completedSessions,
        minutes: acc.minutes + session.totalFocusMinutes
      }), { sessions: 0, minutes: 0 });
  };

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>뽀모도로 타이머</h2>
          <p className="text-muted-foreground">집중과 휴식의 균형으로 생산성 향상</p>
        </div>
        
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>뽀모도로 설정</DialogTitle>
              <DialogDescription>
                뽀모도로 타이머 설정을 변경하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">집중 시간 (분)</label>
                  <Input
                    type="number"
                    value={settings.focusMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, focusMinutes: Number(e.target.value) }))}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className="text-sm">짧은 휴식 (분)</label>
                  <Input
                    type="number"
                    value={settings.shortBreakMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, shortBreakMinutes: Number(e.target.value) }))}
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">긴 휴식 (분)</label>
                  <Input
                    type="number"
                    value={settings.longBreakMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, longBreakMinutes: Number(e.target.value) }))}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className="text-sm">긴 휴식까지 세션 수</label>
                  <Input
                    type="number"
                    value={settings.sessionsUntilLongBreak}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: Number(e.target.value) }))}
                    min="2"
                    max="10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => {
                  saveSettings(settings);
                  if (!isActive) {
                    setTimeLeft(settings.focusMinutes * 60);
                    setIsBreak(false);
                  }
                  setIsSettingsOpen(false);
                }}>
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {isBreak ? <Coffee className="h-5 w-5 text-blue-500" /> : <Timer className="h-5 w-5 text-red-500" />}
              {isBreak ? '휴식 시간' : '집중 시간'}
            </CardTitle>
            {!isBreak && (
              <div className="text-sm text-muted-foreground">
                세션 {completedSessions + 1} / {settings.sessionsUntilLongBreak}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <CircularTimer
                timeLeft={timeLeft}
                totalTime={getTotalTime()}
                isActive={isActive}
                isBreak={isBreak}
              />
            </div>

            <div className="flex justify-center gap-4">
              {!isActive ? (
                <Button onClick={startTimer} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  시작
                </Button>
              ) : (
                <Button onClick={pauseTimer} size="lg" variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  일시정지
                </Button>
              )}
              <Button onClick={resetTimer} size="lg" variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                리셋
              </Button>
            </div>

            {isBreak && (
              <div className="text-center text-sm text-muted-foreground">
                {completedSessions % settings.sessionsUntilLongBreak === 0 ? '긴 휴식' : '짧은 휴식'} 중입니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                오늘의 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl">{todayStats.completedSessions}</div>
                  <div className="text-sm text-muted-foreground">완료 세션</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">{todayStats.totalFocusMinutes}</div>
                  <div className="text-sm text-muted-foreground">집중 시간 (분)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                주간 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl">{weeklyStats.sessions}</div>
                  <div className="text-sm text-muted-foreground">총 세션</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">{Math.round(weeklyStats.minutes / 60 * 10) / 10}h</div>
                  <div className="text-sm text-muted-foreground">총 집중 시간</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.slice(0, 5).map(session => (
                  <div key={session.id} className="flex justify-between items-center p-2 border rounded">
                    <div className="text-sm">
                      {format(new Date(session.date), 'M월 d일', { locale: ko })}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {session.completedSessions}세션
                      </Badge>
                      <Badge variant="outline">
                        {session.totalFocusMinutes}분
                      </Badge>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    아직 기록이 없습니다
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}