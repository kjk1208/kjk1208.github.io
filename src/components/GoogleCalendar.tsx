import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, AlertCircle, ExternalLink, RefreshCw, Link, CheckCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  type: 'work' | 'personal' | 'family' | 'research';
}

const eventTypes = [
  { value: 'work', label: '업무', color: 'bg-blue-500' },
  { value: 'personal', label: '개인', color: 'bg-green-500' },
  { value: 'family', label: '가족', color: 'bg-red-500' },
  { value: 'research', label: '연구', color: 'bg-purple-500' }
];

export default function GoogleCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    location: '',
    type: 'personal' as 'work' | 'personal' | 'family' | 'research'
  });

  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    const savedGoogleConnection = localStorage.getItem('googleCalendarConnected');
    const savedLastSync = localStorage.getItem('lastGoogleSync');
    
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
    if (savedGoogleConnection === 'true') {
      setIsGoogleConnected(true);
    }
    if (savedLastSync) {
      setLastSyncTime(savedLastSync);
    }
  }, []);

  const saveEvents = (updatedEvents: CalendarEvent[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  };

  const handleSubmit = () => {
    if (!newEvent.title.trim()) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      ...newEvent
    };

    const updatedEvents = [...events, event].sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
      return dateA.getTime() - dateB.getTime();
    });

    saveEvents(updatedEvents);
    
    setNewEvent({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      location: '',
      type: 'personal'
    });
    setIsEventDialogOpen(false);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[1];
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => new Date(event.date) >= today)
      .slice(0, 5);
  };

  const getTodayEvents = () => {
    const today = new Date();
    return events.filter(event => isSameDay(new Date(event.date), today));
  };

  const connectToGoogleCalendar = async () => {
    setIsSyncing(true);
    
    try {
      // 실제 Google Calendar 연동을 위한 OAuth 인증
      // 현재는 시뮬레이션 버전으로 구현
      
      // Google Calendar API 연동을 위해서는 다음이 필요합니다:
      // 1. Google Cloud Console에서 프로젝트 생성
      // 2. Calendar API 활성화
      // 3. OAuth 2.0 클라이언트 ID 생성
      // 4. 인증 스코프: https://www.googleapis.com/auth/calendar.readonly
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsGoogleConnected(true);
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleString('ko-KR'));
      localStorage.setItem('googleCalendarConnected', 'true');
      localStorage.setItem('lastGoogleSync', new Date().toLocaleString('ko-KR'));
      
      // Mock Google Calendar events (실제 연동 시 API에서 가져올 데이터)
      const mockGoogleEvents: CalendarEvent[] = [
        {
          id: 'google_1',
          title: '회사 미팅',
          description: '프로젝트 진행상황 논의',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '14:00',
          location: '회의실 A',
          type: 'work'
        },
        {
          id: 'google_2',
          title: '논문 스터디',
          description: 'LLM 관련 논문 리뷰',
          date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
          time: '19:00',
          location: '온라인',
          type: 'research'
        },
        {
          id: 'google_3',
          title: '스똥시와 데이트',
          description: '영화 보기',
          date: format(new Date(Date.now() + 2 * 86400000), 'yyyy-MM-dd'),
          time: '19:30',
          location: 'CGV',
          type: 'family'
        }
      ];

      const updatedEvents = [...events, ...mockGoogleEvents];
      saveEvents(updatedEvents);
      
    } catch (error) {
      console.error('Google Calendar 연동 실패:', error);
      setIsSyncing(false);
      alert('Google Calendar 연동에 실패했습니다. 나중에 다시 시도해주세요.');
    }
  };

  const syncWithGoogleCalendar = () => {
    if (!isGoogleConnected) return;
    
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleString('ko-KR'));
      localStorage.setItem('lastGoogleSync', new Date().toLocaleString('ko-KR'));
    }, 1500);
  };

  const disconnectGoogleCalendar = () => {
    setIsGoogleConnected(false);
    setLastSyncTime(null);
    localStorage.removeItem('googleCalendarConnected');
    localStorage.removeItem('lastGoogleSync');
    
    // Remove Google Calendar events
    const filteredEvents = events.filter(event => !event.id.startsWith('google_'));
    saveEvents(filteredEvents);
  };

  const addToGoogleCalendar = (event: CalendarEvent) => {
    const startDateTime = `${event.date}T${event.time || '09:00'}:00`;
    const endDateTime = `${event.date}T${event.time ? format(new Date(`${event.date}T${event.time}:00`).getTime() + 3600000, 'HH:mm') : '10:00'}:00`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location || '')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2>캘린더</h2>
          <p className="text-muted-foreground">
            일정 관리 및 구글 캘린더 연동
          </p>
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground mt-1">
              마지막 동기화: {lastSyncTime}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!isGoogleConnected ? (
            <Button 
              variant="outline" 
              onClick={connectToGoogleCalendar}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Link className="h-4 w-4" />
              )}
              구글 캘린더 연동
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={syncWithGoogleCalendar}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                동기화
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnectGoogleCalendar}
                className="text-red-600 hover:text-red-700"
              >
                연동 해제
              </Button>
            </div>
          )}
          
          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                일정 추가
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw]">
            <DialogHeader>
              <DialogTitle>새 일정 추가</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 sm:space-y-4 p-1 sm:p-0">
              <Input
                placeholder="일정 제목"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="text-sm sm:text-base"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="시간 (선택사항)"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <Input
                  placeholder="장소 (선택사항)"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <Textarea
                placeholder="일정 설명"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="text-sm"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)} size="sm">
                  취소
                </Button>
                <Button onClick={handleSubmit} disabled={!newEvent.title.trim()} size="sm">
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Google Calendar Connection Status */}
      {isGoogleConnected ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            구글 캘린더와 연동되었습니다. 일정이 자동으로 동기화됩니다.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p>구글 캘린더 연동이 필요합니다.</p>
              <div className="text-sm space-y-1">
                <p><strong>연동 후 사용 가능한 기능:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>기존 구글 캘린더 일정 자동 가져오기</li>
                  <li>양방향 일정 동기화</li>
                  <li>구글 캘린더 바로가기</li>
                  <li>실시간 일정 업데이트</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                캘린더
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://calendar.google.com', '_blank')}
                className="hidden sm:flex"
              >
                구글 캘린더 열기
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ko}
              className="rounded-md border w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-lg font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full h-20",
                day: "h-full w-full p-2 font-normal hover:bg-accent hover:text-accent-foreground flex flex-col items-start justify-start rounded-md",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                DayContent: React.memo(({ date }) => {
                  const dayEvents = getEventsForDate(date);
                  return (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{date.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <div className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                            {dayEvents.length}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event, index) => {
                          const typeInfo = getEventTypeInfo(event.type);
                          return (
                            <div
                              key={`${event.id || index}`}
                              className={`text-xs p-1 rounded truncate ${typeInfo.color} text-white`}
                              title={`${event.time ? event.time + ' - ' : ''}${event.title}`}
                            >
                              {event.time && <span className="block text-xs opacity-80">{event.time}</span>}
                              <span className="block truncate">{event.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2}개 더
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              }}
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'M월 d일', { locale: ko }) : '오늘'} 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-muted-foreground text-sm">일정이 없습니다.</p>
                  ) : (
                    getEventsForDate(selectedDate).map(event => {
                      const typeInfo = getEventTypeInfo(event.type);
                      return (
                        <div
                          key={event.id}
                          className="p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${typeInfo.color}`}></div>
                                <h5 className="font-medium">{event.title}</h5>
                              </div>
                              {event.time && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">날짜를 선택해주세요.</p>
              )}
            </CardContent>
          </Card>

          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">오늘의 일정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getTodayEvents().length === 0 ? (
                  <p className="text-muted-foreground text-sm">오늘 일정이 없습니다.</p>
                ) : (
                  getTodayEvents().map(event => {
                    const typeInfo = getEventTypeInfo(event.type);
                    return (
                      <div key={event.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className={`w-2 h-2 rounded-full ${typeInfo.color}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.time && (
                            <p className="text-xs text-muted-foreground">{event.time}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">다가오는 일정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getUpcomingEvents().length === 0 ? (
                  <p className="text-muted-foreground text-sm">예정된 일정이 없습니다.</p>
                ) : (
                  getUpcomingEvents().map(event => {
                    const typeInfo = getEventTypeInfo(event.type);
                    return (
                      <div key={event.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className={`w-2 h-2 rounded-full ${typeInfo.color}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.date), 'M월 d일', { locale: ko })}
                            {event.time && ` ${event.time}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getEventTypeInfo(selectedEvent.type).label}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(selectedEvent.date), 'yyyy년 M월 d일', { locale: ko })}
                </div>
                
                {selectedEvent.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {selectedEvent.time}
                  </div>
                )}
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {selectedEvent.location}
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <h5 className="mb-2">설명</h5>
                  <p className="text-sm whitespace-pre-wrap border p-3 rounded bg-muted/50">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}