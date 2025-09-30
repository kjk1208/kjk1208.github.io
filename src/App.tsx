import React, { useState, useEffect, Suspense, ErrorBoundary } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Input } from './components/ui/input';
import { LogIn, LogOut, Heart, BookOpen, Timer, User, Calendar, Home, Loader2, Moon, Sun } from 'lucide-react';

// Import critical components directly (no lazy loading)
import MarriageLife from './components/MarriageLife';
import About from './components/About';

// Lazy load only less critical components with preloading
const PaperStudy = React.lazy(() => import('./components/PaperStudy'));
const PomodoroTimer = React.lazy(() => import('./components/PomodoroTimer'));
const GoogleCalendar = React.lazy(() => import('./components/GoogleCalendar'));

// Preload components when user hovers over tabs
const preloadComponent = (componentLoader: () => Promise<any>) => {
  componentLoader().catch(() => {
    // Ignore preload errors
  });
};

const CORRECT_PASSWORD = 'tmehdtl12!@';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30분 (밀리초)

interface User {
  name: string;
  isLoggedIn: boolean;
}

interface LoginAttempts {
  count: number;
  lastFailedAt: number;
}



// Loading component - lightweight version
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

// Error Fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <div className="text-red-500 mb-4">⚠️ 컴포넌트 로딩 중 오류가 발생했습니다</div>
    <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
    <Button onClick={resetErrorBoundary} variant="outline" size="sm">
      다시 시도
    </Button>
  </div>
);

// Simple Error Boundary
class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || ErrorFallback;
      return <Fallback error={this.state.error!} resetErrorBoundary={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('marriage');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [password, setPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempts>({ count: 0, lastFailedAt: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Check login attempts
    const savedAttempts = localStorage.getItem('loginAttempts');
    if (savedAttempts) {
      const attempts: LoginAttempts = JSON.parse(savedAttempts);
      setLoginAttempts(attempts);
      
      // Check if still locked out
      const now = Date.now();
      const timeSinceLastFail = now - attempts.lastFailedAt;
      
      if (attempts.count >= MAX_FAILED_ATTEMPTS && timeSinceLastFail < LOCKOUT_DURATION) {
        setIsLocked(true);
        setLockoutTimeRemaining(LOCKOUT_DURATION - timeSinceLastFail);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handlePasswordLogin = () => {
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    // Check if locked out
    if (isLocked) {
      const minutes = Math.ceil(lockoutTimeRemaining / 60000);
      alert(`너무 많은 로그인 시도로 인해 ${minutes}분 동안 잠금되었습니다.`);
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      // Password is incorrect
      const now = Date.now();
      const newAttempts: LoginAttempts = {
        count: loginAttempts.count + 1,
        lastFailedAt: now
      };
      
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', JSON.stringify(newAttempts));
      
      if (newAttempts.count >= MAX_FAILED_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTimeRemaining(LOCKOUT_DURATION);
        alert(`비밀번호를 ${MAX_FAILED_ATTEMPTS}회 이상 틀려 30분 동안 잠금됩니다.`);
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts.count;
        alert(`비밀번호가 올바르지 않습니다. (${remainingAttempts}회 남음)`);
      }
      
      setPassword('');
      return;
    }

    // 로그인 성공 - 실패 횟수 초기화
    const userData = {
      name: '김준광',
      isLoggedIn: true
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Reset login attempts on successful login
    setLoginAttempts({ count: 0, lastFailedAt: 0 });
    localStorage.removeItem('loginAttempts');
    setIsLocked(false);
    setLockoutTimeRemaining(0);
    
    setPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    setPassword('');
    localStorage.removeItem('user');
    // Don't reset login attempts on logout - keep security measures
  };

  // Preload components after successful login
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        preloadComponent(() => import('./components/PomodoroTimer'));
        preloadComponent(() => import('./components/PaperStudy'));
      }, 1000);
    }
  }, [user]);

  // Lockout countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLocked && lockoutTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockoutTimeRemaining((prev) => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            setIsLocked(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, lockoutTimeRemaining]);

  // Show loading screen
  if (loading) {
    return (
      <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }



  // If user is not logged in, show login screen
  if (!user) {
    return (
      <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          {/* Theme toggle button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-50"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">김준광의 개인 웹사이트</CardTitle>
              <p className="text-center text-muted-foreground">
                비밀번호를 입력하여 로그인하세요
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder={isLocked ? "로그인 잠금됨" : "비밀번호 입력"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || isLocked}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && password && !isLocked) {
                        handlePasswordLogin();
                      }
                    }}
                    className="text-center"
                  />
                  <Button 
                    onClick={handlePasswordLogin} 
                    disabled={loading || !password || isLocked}
                    className="w-full"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {loading ? '로그인 중...' : 
                     isLocked ? '잠금됨' : '로그인'}
                  </Button>
                  
                  {/* Show lockout information */}
                  {isLocked && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300 text-center">
                        🔒 <strong>로그인 잠금</strong>
                      </p>
                      <div className="text-center mt-2">
                        <div className="text-lg font-mono text-red-600 dark:text-red-400">
                          {Math.floor(lockoutTimeRemaining / 60000)}:{((lockoutTimeRemaining % 60000) / 1000).toFixed(0).padStart(2, '0')}
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          남은 시간
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show attempt counter when not locked */}
                  {!isLocked && loginAttempts.count > 0 && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                        ⚠️ 실패 횟수: {loginAttempts.count}/{MAX_FAILED_ATTEMPTS}
                        {loginAttempts.count >= 3 && (
                          <span className="block mt-1">
                            {MAX_FAILED_ATTEMPTS - loginAttempts.count}회 더 틀리면 30분 잠금됩니다
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User is authorized and logged in

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="hidden sm:block">준광이의 개인 웹사이트</h1>
            <h1 className="block sm:hidden">준광이 사이트</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={toggleTheme} 
              variant="outline" 
              size="sm"
              className="p-2"
              title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-2 sm:px-4 py-3 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-4 sm:mb-6">
            <TabsTrigger value="marriage" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Home className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">결혼생활</span>
            </TabsTrigger>
            <TabsTrigger 
              value="papers" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              onMouseEnter={() => preloadComponent(() => import('./components/PaperStudy'))}
            >
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">논문</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pomodoro" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              onMouseEnter={() => preloadComponent(() => import('./components/PomodoroTimer'))}
            >
              <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">타이머</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm sm:col-span-1">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm sm:col-span-1"
              onMouseEnter={() => preloadComponent(() => import('./components/GoogleCalendar'))}
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">캘린더</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marriage">
            <MarriageLife />
          </TabsContent>

          <TabsContent value="papers">
            <SimpleErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <PaperStudy />
              </Suspense>
            </SimpleErrorBoundary>
          </TabsContent>

          <TabsContent value="pomodoro">
            <SimpleErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <PomodoroTimer />
              </Suspense>
            </SimpleErrorBoundary>
          </TabsContent>

          <TabsContent value="about">
            <About />
          </TabsContent>

          <TabsContent value="calendar">
            <SimpleErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <GoogleCalendar />
              </Suspense>
            </SimpleErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}