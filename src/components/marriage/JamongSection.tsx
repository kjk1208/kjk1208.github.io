import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import RichTextEditor from '../RichTextEditor';
import { Plus, Upload, Heart, Calendar, ArrowLeft, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { uploadImage, saveData, getData, deleteData } from '../../utils/api';

interface JamongPost {
  id: string;
  date: string;
  title: string;
  content: string;
  image?: string;
  type: 'post' | 'ultrasound';
}

export default function JamongSection() {
  const [posts, setPosts] = useState<JamongPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postType, setPostType] = useState<'post' | 'ultrasound'>('post');
  const [selectedPost, setSelectedPost] = useState<JamongPost | null>(null);
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: ''
  });
  const [editingPost, setEditingPost] = useState({
    title: '',
    content: '',
    image: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      console.log('=== Loading Jamong Posts ===');
      const savedPosts = await getData('board_jamong_posts');
      console.log('Jamong posts loaded from server:', savedPosts ? savedPosts.length : 0);
      if (savedPosts) {
        console.log('Setting jamong posts:', savedPosts);
        if (savedPosts.length > 0) {
          console.log('First jamong post structure:', {
            keys: Object.keys(savedPosts[0]),
            hasImage: 'image' in savedPosts[0],
            imageValue: savedPosts[0].image ? savedPosts[0].image.substring(0, 100) + '...' : 'none'
          });
        }
        setPosts(savedPosts);
      }
    } catch (error) {
      console.error('Failed to load jamong posts from server:', error);
      // Fallback to localStorage
      console.log('Trying localStorage fallback for jamong posts...');
      const localPosts = localStorage.getItem('board_jamong_posts');
      if (localPosts) {
        console.log('Loaded jamong posts from localStorage');
        setPosts(JSON.parse(localPosts));
      } else {
        console.log('No jamong posts found in localStorage either');
      }
    }
  };

  const savePosts = async (updatedPosts: JamongPost[]) => {
    console.log('=== Saving Jamong Posts ===');
    console.log('Posts to save:', updatedPosts.length);
    if (updatedPosts.length > 0) {
      console.log('First post to save:', {
        keys: Object.keys(updatedPosts[0]),
        hasImage: 'image' in updatedPosts[0],
        imageValue: updatedPosts[0].image ? updatedPosts[0].image.substring(0, 100) + '...' : 'none'
      });
    }
    
    setPosts(updatedPosts);
    try {
      await saveData('board_jamong_posts', updatedPosts);
      console.log('Jamong posts saved to server successfully');
    } catch (error) {
      console.error('Failed to save jamong posts to server:', error);
      // Fallback to localStorage
      console.log('Falling back to localStorage for jamong posts');
      localStorage.setItem('board_jamong_posts', JSON.stringify(updatedPosts));
    }
  };

  const handleSubmit = async () => {
    if (!newPost.title.trim()) return;

    let imageUrl: string | undefined = undefined;
    
    // If there's a selected file, upload it to Supabase
    if (selectedFile) {
      try {
        console.log('=== Jamong Image Upload ===');
        console.log('Uploading jamong image:', selectedFile.name, 'Size:', selectedFile.size);
        imageUrl = await uploadImage(selectedFile);
        console.log('Jamong image uploaded successfully:', imageUrl);
        console.log('=== Jamong Image Upload Complete ===');
      } catch (error) {
        console.error('=== Jamong Image Upload Failed ===');
        console.error('Error details:', error);
        console.error('File:', selectedFile.name, 'Size:', selectedFile.size);
        alert('이미지 업로드에 실패했습니다.');
        return;
      }
    }

    const post: JamongPost = {
      id: Date.now().toString(),
      date: format(new Date(), 'yyyy-MM-dd', { locale: ko }),
      title: newPost.title,
      content: newPost.content,
      image: imageUrl,
      type: postType
    };

    console.log('=== Creating Jamong Post ===');
    console.log('Post data:', {
      id: post.id,
      title: post.title,
      hasImage: !!post.image,
      imageUrl: post.image ? post.image.substring(0, 100) + '...' : 'none'
    });

    const updatedPosts = [post, ...posts];
    await savePosts(updatedPosts);
    
    setNewPost({ title: '', content: '', image: '' });
    setSelectedFile(null);
    setIsDialogOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openPostFullscreen = (post: JamongPost) => {
    setSelectedPost(post);
    setIsFullscreenView(true);
  };

  const closePostFullscreen = () => {
    setSelectedPost(null);
    setIsFullscreenView(false);
    setIsEditMode(false);
  };

  const handleEdit = (post: JamongPost) => {
    setEditingPost({
      title: post.title,
      content: post.content,
      image: post.image || ''
    });
    setIsEditMode(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPost || !editingPost.title.trim()) return;

    let imageUrl = editingPost.image;
    
    // If there's a new image file, upload it to Supabase
    if (editSelectedFile) {
      try {
        console.log('Uploading edited jamong image:', editSelectedFile.name);
        imageUrl = await uploadImage(editSelectedFile);
        console.log('Edited jamong image uploaded successfully:', imageUrl);
      } catch (error) {
        console.error('Failed to upload edited jamong image:', error);
        alert('이미지 업로드에 실패했습니다.');
        return;
      }
    }

    const updatedPost: JamongPost = {
      ...selectedPost,
      title: editingPost.title,
      content: editingPost.content,
      image: imageUrl || undefined
    };

    const updatedPosts = posts.map(post => 
      post.id === selectedPost.id ? updatedPost : post
    );
    await savePosts(updatedPosts);
    setSelectedPost(updatedPost);
    setEditSelectedFile(null);
    setIsEditMode(false);
  };

  const handleDelete = async (postId: string) => {
    if (confirm('정말 이 글을 삭제하시겠습니까?')) {
      const updatedPosts = posts.filter(post => post.id !== postId);
      await savePosts(updatedPosts);
      setSelectedPost(null);
      setIsFullscreenView(false);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingPost(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>자몽이 성장 기록</h3>
          <p className="text-muted-foreground">우리 아들 자몽이의 소중한 순간들</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset form when dialog is closed
            setNewPost({ title: '', content: '', image: '' });
            setSelectedFile(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 글 작성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw]">
            <DialogHeader>
              <DialogTitle>자몽이 기록 추가</DialogTitle>
              <DialogDescription>
                자몽이에 대한 소중한 이야기를 작성해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 sm:space-y-4 p-1 sm:p-0">
              {/* Post Type Selection */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={postType === 'post' ? 'default' : 'outline'}
                  onClick={() => setPostType('post')}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  일반 포스트
                </Button>
                <Button
                  variant={postType === 'ultrasound' ? 'default' : 'outline'}
                  onClick={() => setPostType('ultrasound')}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  초음파 사진
                </Button>
              </div>

              {/* Title */}
              <div>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{postType === 'ultrasound' ? '초음파 사진 업로드' : '사진 업로드 (선택사항)'}</span>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm"
                  />
                </label>
              </div>

              {/* Image Preview */}
              {newPost.image && (
                <div className="flex justify-center">
                  <ImageWithFallback
                    src={newPost.image}
                    alt="Preview"
                    className="max-w-full sm:max-w-xs h-32 sm:h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Rich Text Editor */}
              <div className="min-h-0">
                <RichTextEditor
                  value={newPost.content}
                  onChange={(content) => setNewPost(prev => ({ ...prev, content }))}
                  placeholder="자몽이에 대한 소중한 이야기를 자세히 작성해주세요..."
                  height="250px"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setNewPost({ title: '', content: '', image: '' });
                  setSelectedFile(null);
                }} size="sm">
                  취소
                </Button>
                <Button onClick={handleSubmit} disabled={!newPost.title.trim()} size="sm">
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">아직 작성된 기록이 없습니다</p>
              <p className="text-sm text-muted-foreground">첫 번째 기록을 남겨보세요!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openPostFullscreen(post)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {post.type === 'ultrasound' && (
                        <Heart className="h-4 w-4 text-red-500" />
                      )}
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.type === 'ultrasound' && (
                      <div className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        초음파
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {post.image && (
                  <div className="mb-4">
                    <ImageWithFallback
                      src={post.image}
                      alt={post.title}
                      className="w-full max-w-md h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div 
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: post.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/__(.*?)__/g, '<u>$1</u>')
                      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
                      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded overflow-x-auto my-3"><code>$1</code></pre>')
                      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
                      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
                      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
                      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-muted-foreground pl-4 italic my-3 text-muted-foreground">$1</blockquote>')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline hover:text-blue-700" target="_blank">$1</a>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Fullscreen Post View */}
      {isFullscreenView && selectedPost && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePostFullscreen}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    목록으로
                  </Button>
                  <div className="flex items-center gap-2">
                    {selectedPost.type === 'ultrasound' && (
                      <Heart className="h-4 w-4 text-red-500" />
                    )}
                    <h1 className="text-lg font-semibold truncate max-w-[300px] sm:max-w-[500px]">
                      {selectedPost.title}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(selectedPost)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedPost.id)}
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
                        disabled={!editingPost.title.trim()}
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {selectedPost.date}
                      </div>
                      {selectedPost.type === 'ultrasound' && (
                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          초음파 사진
                        </div>
                      )}
                    </div>

                    {/* Image */}
                    {selectedPost.image && (
                      <div className="mb-8 text-center">
                        <ImageWithFallback
                          src={selectedPost.image}
                          alt={selectedPost.title}
                          className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                          style={{ maxHeight: '60vh' }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-lg max-w-none">
                      <div 
                        className="text-base leading-relaxed"
                        style={{ fontSize: '16px', lineHeight: '1.7' }}
                        dangerouslySetInnerHTML={{ 
                          __html: selectedPost.content
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
                      <span className="text-muted-foreground">수정 모드</span>
                      {selectedPost.type === 'ultrasound' && (
                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          초음파 사진
                        </div>
                      )}
                    </div>

                    <Input
                      placeholder="제목을 입력하세요"
                      value={editingPost.title}
                      onChange={(e) => setEditingPost(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg"
                    />

                    <div>
                      <label className="block mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="h-4 w-4" />
                          사진 업로드 (선택사항)
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageUpload}
                        />
                      </label>
                      
                      {editingPost.image && (
                        <div className="mt-4 text-center">
                          <ImageWithFallback
                            src={editingPost.image}
                            alt="Preview"
                            className="max-w-md h-64 object-cover rounded-lg mx-auto"
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-h-[60vh]">
                      <RichTextEditor
                        value={editingPost.content}
                        onChange={(content) => setEditingPost(prev => ({ ...prev, content }))}
                        placeholder="자몽이에 대한 소중한 이야기를 자세히 작성해주세요..."
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