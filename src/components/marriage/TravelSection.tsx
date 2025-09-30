import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Plus, MapPin, Calendar, Users, DollarSign, Clock, Upload, Image, Edit, Eye, ArrowLeft, Trash2 } from 'lucide-react';
import { uploadImage, saveData, getData } from '../../utils/api';

interface TravelDay {
  day: number;
  activities: string;
  images: string[];
}

interface Travel {
  id: string;
  title: string;
  destination: string;
  companion: string;
  duration: number;
  budget: number;
  startDate: string;
  endDate: string;
  description: string;
  days: TravelDay[];
}

export default function TravelSection() {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newTravel, setNewTravel] = useState({
    title: '',
    destination: '',
    companion: '스똥시',
    duration: 1,
    budget: 0,
    startDate: '',
    endDate: '',
    description: '',
    days: [{ day: 1, activities: '', images: [] }] as TravelDay[]
  });
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);

  useEffect(() => {
    loadTravels();
  }, []);

  const loadTravels = async () => {
    try {
      console.log('=== Loading Travel Data ===');
      const savedTravels = await getData('board_travel_records');
      console.log('Travel data loaded from server:', savedTravels ? savedTravels.length : 0);
      if (savedTravels) {
        console.log('Setting travel data:', savedTravels);
        if (savedTravels.length > 0) {
          console.log('First travel structure:', {
            keys: Object.keys(savedTravels[0]),
            hasDays: 'days' in savedTravels[0],
            daysCount: savedTravels[0].days ? savedTravels[0].days.length : 0,
            firstDayImages: savedTravels[0].days && savedTravels[0].days[0] ? savedTravels[0].days[0].images?.length || 0 : 0
          });
        }
        setTravels(savedTravels);
      }
    } catch (error) {
      console.error('Failed to load travels from server:', error);
      // Fallback to localStorage
      console.log('Trying localStorage fallback for travels...');
      const localTravels = localStorage.getItem('board_travel_records');
      if (localTravels) {
        console.log('Loaded travels from localStorage');
        setTravels(JSON.parse(localTravels));
      } else {
        console.log('No travels found in localStorage either');
      }
    }
  };

  const saveTravels = async (updatedTravels: Travel[]) => {
    console.log('=== Saving Travel Data ===');
    console.log('Travels to save:', updatedTravels.length);
    if (updatedTravels.length > 0) {
      console.log('First travel to save:', {
        keys: Object.keys(updatedTravels[0]),
        hasDays: 'days' in updatedTravels[0],
        daysCount: updatedTravels[0].days ? updatedTravels[0].days.length : 0,
        firstDayImages: updatedTravels[0].days && updatedTravels[0].days[0] ? updatedTravels[0].days[0].images?.length || 0 : 0
      });
    }
    
    setTravels(updatedTravels);
    try {
      await saveData('board_travel_records', updatedTravels);
      console.log('Travel data saved to server successfully');
    } catch (error) {
      console.error('Failed to save travels to server:', error);
      // Fallback to localStorage
      console.log('Falling back to localStorage for travels');
      localStorage.setItem('board_travel_records', JSON.stringify(updatedTravels));
    }
  };

  const handleSubmit = async () => {
    if (!newTravel.title.trim() || !newTravel.destination.trim()) return;

    const travel: Travel = {
      id: Date.now().toString(),
      ...newTravel
    };

    const updatedTravels = [travel, ...travels];
    await saveTravels(updatedTravels);
    
    setNewTravel({
      title: '',
      destination: '',
      companion: '스똥시',
      duration: 1,
      budget: 0,
      startDate: '',
      endDate: '',
      description: '',
      days: [{ day: 1, activities: '', images: [] }]
    });
    setIsDialogOpen(false);
  };

  const openTravelFullscreen = (travel: Travel) => {
    setSelectedTravel(travel);
    setIsFullscreenView(true);
  };

  const closeTravelFullscreen = () => {
    setSelectedTravel(null);
    setIsFullscreenView(false);
    setIsEditMode(false);
  };

  const handleEdit = (travel: Travel) => {
    setEditingTravel({ ...travel });
    setIsEditMode(true);
  };

  const handleDelete = async (travelId: string) => {
    if (confirm('정말 이 여행 기록을 삭제하시겠습니까?')) {
      const updatedTravels = travels.filter(travel => travel.id !== travelId);
      await saveTravels(updatedTravels);
      setSelectedTravel(null);
      setIsFullscreenView(false);
    }
  };

  const updateDuration = (duration: number) => {
    const days = Array.from({ length: duration }, (_, i) => ({
      day: i + 1,
      activities: newTravel.days[i]?.activities || '',
      images: newTravel.days[i]?.images || []
    }));
    setNewTravel(prev => ({ ...prev, duration, days }));
  };

  const updateDayActivity = (dayIndex: number, activities: string) => {
    const updatedDays = [...newTravel.days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], activities };
    setNewTravel(prev => ({ ...prev, days: updatedDays }));
  };

  const handleDayImageUpload = async (dayIndex: number, files: FileList) => {
    try {
      console.log('=== Travel Images Upload ===');
      console.log(`Uploading ${files.length} travel images for day ${dayIndex + 1}`);
      const imageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading travel image ${i + 1}/${files.length}:`, file.name, 'Size:', file.size);
        const imageUrl = await uploadImage(file);
        console.log(`Travel image ${i + 1} uploaded successfully:`, imageUrl);
        imageUrls.push(imageUrl);
      }
      
      const updatedDays = [...newTravel.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        images: [...updatedDays[dayIndex].images, ...imageUrls]
      };
      console.log(`Updated travel day ${dayIndex + 1} with ${imageUrls.length} new images`);
      console.log('Day images array:', updatedDays[dayIndex].images);
      console.log('=== Travel Images Upload Complete ===');
      
      setNewTravel(prev => ({ ...prev, days: updatedDays }));
    } catch (error) {
      console.error('=== Travel Images Upload Failed ===');
      console.error('Error details:', error);
      console.error('Files:', Array.from(files).map(f => ({ name: f.name, size: f.size })));
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>여행 기록</h3>
          <p className="text-muted-foreground">스똥시와 함께한 소중한 여행 추억들</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset form when dialog is closed
            setNewTravel({
              title: '',
              destination: '',
              companion: '스똥시',
              duration: 1,
              budget: 0,
              startDate: '',
              endDate: '',
              description: '',
              days: [{ day: 1, activities: '', images: [] }]
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              여행 기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw]">
            <DialogHeader>
              <DialogTitle>새 여행 기록</DialogTitle>
              <DialogDescription>
                여행에 대한 상세한 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 p-1 sm:p-0">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="여행 제목"
                  value={newTravel.title}
                  onChange={(e) => setNewTravel(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="여행지"
                  value={newTravel.destination}
                  onChange={(e) => setNewTravel(prev => ({ ...prev, destination: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="동행자"
                  value={newTravel.companion}
                  onChange={(e) => setNewTravel(prev => ({ ...prev, companion: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="여행 일수"
                  value={newTravel.duration}
                  onChange={(e) => updateDuration(Number(e.target.value))}
                  min="1"
                />
                <Input
                  type="number"
                  placeholder="총 예산 (원)"
                  value={newTravel.budget}
                  onChange={(e) => setNewTravel(prev => ({ ...prev, budget: Number(e.target.value) }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  placeholder="시작일"
                  value={newTravel.startDate}
                  onChange={(e) => setNewTravel(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="종료일"
                  value={newTravel.endDate}
                  onChange={(e) => setNewTravel(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              {/* Description */}
              <Textarea
                placeholder="여행 전체 설명"
                value={newTravel.description}
                onChange={(e) => setNewTravel(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />

              {/* Daily Itinerary */}
              <div className="space-y-4">
                <h4>일별 일정</h4>
                <div className="space-y-4">
                  {newTravel.days.map((day, index) => (
                    <Card key={day.day} className="p-4">
                      <div className="space-y-4">
                        {/* Day Header */}
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-full">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Day {day.day}</span>
                          </div>
                        </div>
                        
                        {/* Activities */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">일정 내용</label>
                          <Textarea
                            placeholder={`${day.day}일차 일정을 입력하세요`}
                            value={day.activities}
                            onChange={(e) => updateDayActivity(index, e.target.value)}
                            rows={3}
                          />
                        </div>
                        
                        {/* Images */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            사진 업로드
                          </label>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => e.target.files && handleDayImageUpload(index, e.target.files)}
                          />
                          
                          {day.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {day.images.map((image, imgIndex) => (
                                <ImageWithFallback
                                  key={imgIndex}
                                  src={image}
                                  alt={`Day ${day.day} 사진 ${imgIndex + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setNewTravel({
                    title: '',
                    destination: '',
                    companion: '스똥시',
                    duration: 1,
                    budget: 0,
                    startDate: '',
                    endDate: '',
                    description: '',
                    days: [{ day: 1, activities: '', images: [] }]
                  });
                }}>
                  취소
                </Button>
                <Button onClick={handleSubmit} disabled={!newTravel.title.trim() || !newTravel.destination.trim()}>
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {travels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">아직 기록된 여행이 없습니다</p>
              <p className="text-sm text-muted-foreground">첫 번째 여행을 기록해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          travels.map((travel) => (
            <Card key={travel.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openTravelFullscreen(travel)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      {travel.title}
                    </CardTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {travel.destination}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {travel.companion}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {travel.duration}일
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {travel.budget.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2 mb-3">{travel.description}</p>
                
                {/* Travel Overview */}
                <div className="space-y-2">
                  {travel.days.slice(0, 3).map((day) => (
                    <div key={day.day} className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Day {day.day}</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-1 ml-5">
                        {day.activities || '일정 없음'}
                      </p>
                      {day.images.length > 0 && (
                        <div className="flex gap-1 ml-5 mt-1">
                          {day.images.slice(0, 3).map((image, index) => (
                            <ImageWithFallback
                              key={index}
                              src={image}
                              alt={`Day ${day.day} 사진`}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ))}
                          {day.images.length > 3 && (
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">
                              +{day.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {travel.days.length > 3 && (
                    <p className="text-xs text-muted-foreground">...그 외 {travel.days.length - 3}일</p>
                  )}
                </div>
                
                {travel.startDate && travel.endDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {travel.startDate} ~ {travel.endDate}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Fullscreen Travel View */}
      {isFullscreenView && selectedTravel && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeTravelFullscreen}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    목록으로
                  </Button>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <h1 className="text-lg font-semibold truncate max-w-[300px] sm:max-w-[500px]">
                      {selectedTravel.title}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(selectedTravel)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedTravel.id)}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        삭제
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditMode(false)}
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsEditMode(false)}
                      >
                        저장
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="container max-w-6xl mx-auto px-4 py-8">
                {!isEditMode ? (
                  // View Mode
                  <>
                    {/* Meta Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTravel.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTravel.companion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTravel.duration}일</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTravel.budget.toLocaleString()}원</span>
                      </div>
                    </div>

                    {selectedTravel.startDate && selectedTravel.endDate && (
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">여행 기간</h3>
                        <p className="text-base">{selectedTravel.startDate} ~ {selectedTravel.endDate}</p>
                      </div>
                    )}

                    {selectedTravel.description && (
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">여행 설명</h3>
                        <p className="whitespace-pre-wrap text-base leading-relaxed">{selectedTravel.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-semibold mb-6">일별 일정</h3>
                      <div className="space-y-6">
                        {selectedTravel.days.map((day) => (
                          <Card key={day.day} className="overflow-hidden">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Day {day.day}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {day.activities && (
                                <p className="whitespace-pre-wrap text-base leading-relaxed mb-6">{day.activities}</p>
                              )}
                              
                              {day.images && day.images.length > 0 && (
                                <div className="space-y-4">
                                  <h5 className="font-medium">사진</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {day.images.map((image, index) => (
                                      <ImageWithFallback
                                        key={index}
                                        src={image}
                                        alt={`Day ${day.day} 사진 ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                                        onClick={() => window.open(image, '_blank')}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  // Edit Mode - 수정 모드는 복잡하므로 기본 메시지만 표시
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">수정 기능은 추후 구현 예정입니다.</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditMode(false)}
                      className="mt-4"
                    >
                      보기 모드로 돌아가기
                    </Button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}