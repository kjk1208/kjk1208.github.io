import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import RichTextEditor from './RichTextEditor';
import { Plus, BookOpen, TrendingUp, DollarSign, Eye, Calendar, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { saveData, getData, deleteData } from '../utils/api';

interface Paper {
  id: string;
  title: string;
  content: string;
  category: 'VTON' | 'LLM' | 'stock';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'VTON', label: 'VTON', icon: '👕' },
  { value: 'LLM', label: 'LLM', icon: '🤖' },
  { value: 'stock', label: '주식', icon: '📈' }
];

export default function PaperStudy() {
  const [activeTab, setActiveTab] = useState('VTON');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPaper, setNewPaper] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [editingPaper, setEditingPaper] = useState({
    title: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const savedPapers = await getData('papers');
      if (savedPapers) {
        setPapers(savedPapers);
      }
    } catch (error) {
      console.error('Failed to load papers:', error);
      // Fallback to localStorage
      const localPapers = localStorage.getItem('papers');
      if (localPapers) {
        setPapers(JSON.parse(localPapers));
      }
    }
  };

  const savePapers = async (updatedPapers: Paper[]) => {
    setPapers(updatedPapers);
    try {
      await saveData('papers', updatedPapers);
    } catch (error) {
      console.error('Failed to save papers to server:', error);
      // Fallback to localStorage
      localStorage.setItem('papers', JSON.stringify(updatedPapers));
    }
  };

  const handleSubmit = async () => {
    if (!newPaper.title.trim() || !newPaper.content.trim()) return;

    const paper: Paper = {
      id: Date.now().toString(),
      title: newPaper.title,
      content: newPaper.content,
      category: activeTab as 'VTON' | 'LLM' | 'stock',
      tags: newPaper.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPapers = [paper, ...papers];
    await savePapers(updatedPapers);
    
    setNewPaper({ title: '', content: '', tags: '' });
    setIsWriteDialogOpen(false);
  };

  const handleEdit = (paper: Paper) => {
    setEditingPaper({
      title: paper.title,
      content: paper.content,
      tags: paper.tags.join(', ')
    });
    setIsEditMode(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPaper || !editingPaper.title.trim() || !editingPaper.content.trim()) return;

    const updatedPaper: Paper = {
      ...selectedPaper,
      title: editingPaper.title,
      content: editingPaper.content,
      tags: editingPaper.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      updatedAt: new Date().toISOString()
    };

    const updatedPapers = papers.map(paper => 
      paper.id === selectedPaper.id ? updatedPaper : paper
    );
    await savePapers(updatedPapers);
    setSelectedPaper(updatedPaper);
    setIsEditMode(false);
  };

  const handleDelete = async (paperId: string) => {
    if (confirm('정말 이 글을 삭제하시겠습니까?')) {
      const updatedPapers = papers.filter(paper => paper.id !== paperId);
      await savePapers(updatedPapers);
      setSelectedPaper(null);
      setIsFullscreenView(false);
    }
  };

  const openPaperFullscreen = (paper: Paper) => {
    setSelectedPaper(paper);
    setIsFullscreenView(true);
  };

  const closePaperFullscreen = () => {
    setSelectedPaper(null);
    setIsFullscreenView(false);
    setIsEditMode(false);
  };

  const getFilteredPapers = (category: string) => {
    return papers.filter(paper => paper.category === category);
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📄';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>논문 스터디</h2>
          <p className="text-muted-foreground">연구 분야별 논문 정리 및 스터디 기록</p>
        </div>
        
        <Dialog open={isWriteDialogOpen} onOpenChange={setIsWriteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              글쓰기
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw]">
            <DialogHeader>
              <DialogTitle>새 논문 스터디 작성</DialogTitle>
              <DialogDescription>
                논문 스터디 내용을 작성해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 sm:space-y-4 p-1 sm:p-2">
              {/* Header Section */}
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">카테고리:</p>
                <Badge variant="outline" className="text-xs">
                  {getCategoryIcon(activeTab)} {categories.find(c => c.value === activeTab)?.label}
                </Badge>
              </div>

              {/* Title and Tags Section */}
              <div className="space-y-3">
                <Input
                  placeholder="논문 제목 또는 주제를 입력하세요"
                  value={newPaper.title}
                  onChange={(e) => setNewPaper(prev => ({ ...prev, title: e.target.value }))}
                  className="text-sm sm:text-base"
                />

                <Input
                  placeholder="태그를 입력하세요 (쉼표로 구분)"
                  value={newPaper.tags}
                  onChange={(e) => setNewPaper(prev => ({ ...prev, tags: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="min-h-0">
                <RichTextEditor
                  value={newPaper.content}
                  onChange={(content) => setNewPaper(prev => ({ ...prev, content }))}
                  placeholder="논문 내용, 요약, 인사이트 등을 자유롭게 작성하세요."
                  height="300px"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsWriteDialogOpen(false)} size="sm">
                  취소
                </Button>
                <Button onClick={handleSubmit} disabled={!newPaper.title.trim() || !newPaper.content.trim()} size="sm">
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {categories.map(category => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
              <span>{category.icon}</span>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.value} value={category.value} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3>{category.label} 연구</h3>
              <p className="text-sm text-muted-foreground">
                총 {getFilteredPapers(category.value).length}개의 글
              </p>
            </div>

            <div className="grid gap-4">
              {getFilteredPapers(category.value).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">아직 작성된 논문이 없습니다</p>
                    <p className="text-sm text-muted-foreground">첫 번째 {category.label} 논문을 작성해보세요!</p>
                  </CardContent>
                </Card>
              ) : (
                getFilteredPapers(category.value).map((paper) => (
                  <Card key={paper.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openPaperFullscreen(paper)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <span>{getCategoryIcon(paper.category)}</span>
                            {paper.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(paper.createdAt), 'yyyy.MM.dd', { locale: ko })}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-sm line-clamp-3 mb-3"
                        dangerouslySetInnerHTML={{
                          __html: paper.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/__(.*?)__/g, '<u>$1</u>')
                            .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
                            .replace(/^### (.*$)/gm, '<strong>$1</strong>')
                            .replace(/^## (.*$)/gm, '<strong>$1</strong>')
                            .replace(/^# (.*$)/gm, '<strong>$1</strong>')
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline" target="_blank">$1</a>')
                            .substring(0, 200) + (paper.content.length > 200 ? '...' : '')
                        }}
                      />
                      {paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {paper.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Fullscreen Paper View */}
      {isFullscreenView && selectedPaper && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePaperFullscreen}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    목록으로
                  </Button>
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(selectedPaper.category)}</span>
                    <h1 className="text-lg font-semibold truncate max-w-[300px] sm:max-w-[500px]">
                      {selectedPaper.title}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(selectedPaper)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedPaper.id)}
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
                        onClick={handleEditSubmit}
                        disabled={!editingPaper.title.trim() || !editingPaper.content.trim()}
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
              <div className="container max-w-4xl mx-auto px-4 py-8">
                {!isEditMode ? (
                  // View Mode
                  <>
                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 mb-8 pb-4 border-b">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {categories.find(c => c.value === selectedPaper.category)?.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        작성: {format(new Date(selectedPaper.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </div>
                      {selectedPaper.updatedAt !== selectedPaper.createdAt && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          수정: {format(new Date(selectedPaper.updatedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {selectedPaper.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {selectedPaper.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-lg max-w-none">
                      <div 
                        className="text-base leading-relaxed min-h-[60vh]"
                        style={{ fontSize: '16px', lineHeight: '1.7' }}
                        dangerouslySetInnerHTML={{ 
                          __html: selectedPaper.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/__(.*?)__/g, '<u>$1</u>')
                            .replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm">$1</code>')
                            .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded overflow-x-auto my-4"><code>$1</code></pre>')
                            .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                            .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
                            .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-5">$1</h1>')
                            .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
                            .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
                            .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-muted pl-4 italic my-4 text-muted-foreground">$1</blockquote>')
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline hover:text-blue-700" target="_blank">$1</a>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  </>
                ) : (
                  // Edit Mode
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {categories.find(c => c.value === selectedPaper.category)?.label}
                      </Badge>
                      <span className="text-muted-foreground">수정 모드</span>
                    </div>

                    <Input
                      placeholder="논문 제목 또는 주제를 입력하세요"
                      value={editingPaper.title}
                      onChange={(e) => setEditingPaper(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg"
                    />

                    <Input
                      placeholder="태그를 입력하세요 (쉼표로 구분)"
                      value={editingPaper.tags}
                      onChange={(e) => setEditingPaper(prev => ({ ...prev, tags: e.target.value }))}
                    />

                    <div className="min-h-[60vh]">
                      <RichTextEditor
                        value={editingPaper.content}
                        onChange={(content) => setEditingPaper(prev => ({ ...prev, content }))}
                        placeholder="논문 내용, 요약, 인사이트 등을 자유롭게 작성하세요."
                        height="600px"
                      />
                    </div>
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