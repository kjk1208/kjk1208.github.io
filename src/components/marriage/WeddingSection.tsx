import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Plus, Upload, Camera, Heart, Trash2, HardDrive } from 'lucide-react';
import Masonry from 'react-responsive-masonry';
import { uploadImage, saveData, getData } from '../../utils/api';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Helper function to calculate aspect ratio from file dimensions only
const getAspectRatioFromDimensions = (width: number, height: number): number => {
  if (width <= 0 || height <= 0) {
    console.warn('Invalid dimensions, using default aspect ratio');
    return 1.33; // Default 4:3 aspect ratio
  }
  return width / height;
};

// Debug function to test API connectivity
const testAPIConnection = async () => {
  try {
    console.log('=== Testing API Connection ===');
    console.log('Project ID:', projectId);
    console.log('Public Key available:', !!publicAnonKey);
    console.log('Public Key (first 20 chars):', publicAnonKey?.substring(0, 20) + '...');
    
    const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-38b6a643`;
    console.log('API Base URL:', API_BASE_URL);
    
    // Test 0: Wedding section cloud mode notification
    console.log('=== WEDDING SECTION CLOUD MODE ===');
    console.log('Testing Supabase connectivity for wedding photos');
    console.log('Will fallback to localStorage if cloud fails');
    
    // Test 1: Check server health for wedding photos
    console.log('Testing Supabase server health...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Health check status:', healthResponse.status);
      console.log('Health check headers:', Object.fromEntries(healthResponse.headers.entries()));
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health check response:', healthData);
      } else {
        const errorText = await healthResponse.text();
        console.error('❌ Health check failed:', errorText);
      }
    } catch (healthError) {
      console.error('❌ Health check request failed:', healthError.message);
    }
    
    // Test 2: Try to get existing data from cloud
    console.log('Testing wedding photos retrieval from cloud...');
    try {
      const existingData = await getData('board_wedding_photos', { forceCloud: true });
      console.log('Existing wedding photos from cloud:', existingData);
    } catch (error) {
      console.log('No existing wedding photos in cloud or error getting them:', error.message);
    }
    
    // Test 3: Try to save test data
    console.log('Testing data saving...');
    try {
      await saveData('test_connection', { test: true, timestamp: Date.now() });
      console.log('Test data saved successfully');
    } catch (error) {
      console.error('Failed to save test data:', error.message);
    }
    
    // Test 4: Test local storage functionality
    console.log('Testing local storage functionality...');
    try {
      // Test localStorage save/get
      const testData = { test: true, timestamp: Date.now() };
      localStorage.setItem('test_connection', JSON.stringify(testData));
      const retrieved = localStorage.getItem('test_connection');
      
      if (retrieved) {
        const parsed = JSON.parse(retrieved);
        console.log('✅ localStorage test successful:', parsed);
        localStorage.removeItem('test_connection');
      }
      
      // Test image upload (will use base64 fallback)
      if (confirm('로컬 이미지 저장 기능도 테스트해보시겠습니까?')) {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, 10, 10);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const testFile = new File([blob], 'test.png', { type: 'image/png' });
              
              try {
                const uploadedUrl = await uploadImage(testFile);
                console.log('✅ Local image storage test successful');
                console.log('Base64 URL length:', uploadedUrl.length);
              } catch (error) {
                console.error('❌ Local image storage test failed:', error);
              }
            }
          }, 'image/png');
        }
      }
    } catch (error) {
      console.error('Local storage test failed:', error);
    }
    
    console.log('=== API Connection Test Complete ===');
    alert('API 연결 테스트가 완료되었습니다. 콘솔을 확인해주세요.');
  } catch (error) {
    console.error('=== API Connection Test Failed ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide specific guidance based on error type
    let userMessage = `API 연결 테스트 실패: ${error.message}\n\n`;
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      userMessage += '가능한 원인:\n';
      userMessage += '• 인터넷 연결 문제\n';
      userMessage += '• 방화벽 또는 보안 소프트웨어 차단\n';
      userMessage += '• Supabase 서비스 일시적 장애\n';
      userMessage += '• CORS 설정 문제\n\n';
      userMessage += '해결 방법:\n';
      userMessage += '• 인터넷 연결 확인\n';
      userMessage += '• 다른 브라우저로 시도\n';
      userMessage += '• VPN 사용시 해제 후 재시도';
    }
    
    userMessage += '\n\n콘솔에서 더 자세한 정보를 확인하세요.';
    
    alert(userMessage);
  }
};

// Storage management function
const manageLocalStorage = () => {
  try {
    let totalSize = 0;
    let imageCount = 0;
    const imageKeys: string[] = [];
    
    // Calculate storage usage
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage[key];
        totalSize += value.length + key.length;
        
        if (key.startsWith('image_')) {
          imageCount++;
          imageKeys.push(key);
        }
      }
    }
    
    const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
    const maxEstimate = 10; // Conservative estimate
    const usagePercent = ((totalSize / (maxEstimate * 1024 * 1024)) * 100).toFixed(1);
    
    let message = `로컬 저장소 현황:\n`;
    message += `• 전체 사용량: ${sizeMB}MB (약 ${usagePercent}% 사용)\n`;
    message += `• 저장된 이미지: ${imageCount}개\n`;
    message += `• 예상 최대 용량: ${maxEstimate}MB\n\n`;
    
    if (parseFloat(usagePercent) > 80) {
      message += `⚠️ 저장소 사용량이 높습니다!\n\n`;
    }
    
    message += `다음 작업을 선택하세요:\n`;
    message += `1. 확인만 하기\n`;
    message += `2. 오래된 이미지 절반 삭제\n`;
    message += `3. 모든 이미지 삭제 (주의!)`;
    
    const choice = prompt(message + '\n\n번호를 입력하세요 (1-3):');
    
    if (choice === '2') {
      // Delete oldest 50% of images
      if (imageKeys.length === 0) {
        alert('삭제할 이미지가 없습니다.');
        return;
      }
      
      if (confirm(`${imageKeys.length}개 중 ${Math.floor(imageKeys.length / 2)}개의 오래된 이미지를 삭제하시겠습니까?`)) {
        imageKeys.sort(); // Sort by timestamp (older first)
        const keysToDelete = imageKeys.slice(0, Math.floor(imageKeys.length / 2));
        
        let deletedSize = 0;
        keysToDelete.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            deletedSize += value.length;
            localStorage.removeItem(key);
          }
        });
        
        const freedMB = (deletedSize / 1024 / 1024).toFixed(1);
        alert(`${keysToDelete.length}개의 이미지를 삭제했습니다.\n${freedMB}MB 공간이 확보되었습니다.`);
        
        // Reload photos to reflect changes
        loadPhotos();
      }
    } else if (choice === '3') {
      // Delete all images
      if (imageKeys.length === 0) {
        alert('삭제할 이미지가 없습니다.');
        return;
      }
      
      if (confirm(`⚠️ 주의: 모든 ${imageKeys.length}개의 이미지가 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.\n\n정말 계속하시겠습니까?`)) {
        let deletedSize = 0;
        imageKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            deletedSize += value.length;
            localStorage.removeItem(key);
          }
        });
        
        const freedMB = (deletedSize / 1024 / 1024).toFixed(1);
        alert(`${imageKeys.length}개의 모든 이미지가 삭제되었습니다.\n${freedMB}MB 공간이 확보되었습니다.`);
        
        // Reload photos to reflect changes
        loadPhotos();
      }
    }
    
  } catch (error) {
    console.error('Storage management error:', error);
    alert(`저장소 관리 중 오류가 발생했습니다: ${error.message}`);
  }
};

interface WeddingPhoto {
  id: string;
  title: string;
  image: string;
  uploadDate: string;
  aspectRatio?: number;
}

export default function WeddingSection() {
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    image: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<WeddingPhoto | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [storageMode, setStorageMode] = useState<'cloud' | 'local' | 'unknown'>('unknown');

  useEffect(() => {
    console.log('💒 Wedding Section: Starting with CLOUD STORAGE MODE');
    console.log('☁️ Wedding photos will be stored in Supabase Storage');
    console.log('📱 Fallback to local storage if cloud fails');
    
    loadPhotos();
    // Storage mode will be set by loadPhotos based on actual source
  }, []);

  const loadPhotos = async () => {
    try {
      console.log('Loading wedding photos from cloud...');
      // Try cloud first, then fallback to local
      const savedPhotos = await getData('board_wedding_photos', { forceCloud: true });
      if (savedPhotos && Array.isArray(savedPhotos)) {
        console.log('Loaded', savedPhotos.length, 'wedding photos from cloud');
        setPhotos(savedPhotos);
        setStorageMode('cloud');
      } else {
        console.log('No wedding photos found in cloud, checking local...');
        const localPhotos = await getData('board_wedding_photos');
        if (localPhotos && Array.isArray(localPhotos)) {
          console.log('Loaded', localPhotos.length, 'wedding photos from local storage');
          setPhotos(localPhotos);
          setStorageMode('local');
        } else {
          console.log('No wedding photos found');
          setPhotos([]);
          setStorageMode('unknown');
        }
      }
    } catch (error) {
      console.error('Failed to load wedding photos:', error);
      setPhotos([]);
      setStorageMode('unknown');
    }
  };

  const savePhotos = async (updatedPhotos: WeddingPhoto[]) => {
    setPhotos(updatedPhotos);
    try {
      console.log('Saving', updatedPhotos.length, 'wedding photos to cloud...');
      // Try to save to cloud first
      await saveData('board_wedding_photos', updatedPhotos, { forceCloud: true });
      console.log('Wedding photos saved successfully to cloud');
      setStorageMode('cloud');
    } catch (error) {
      console.error('Failed to save wedding photos:', error);
      // The saveData function now handles localStorage fallback automatically
      setStorageMode('local');
    }
  };

  const handleSubmit = async () => {
    if (!newPhoto.title.trim() || (!selectedFiles && !newPhoto.image)) return;
    await processFileUpload();
  };

  // Helper to get image dimensions from file before upload
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 1200, height: 900 }); // Default dimensions
      };
      
      img.src = url;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSelectedFiles(files);

    if (files.length === 1) {
      // Single file - show preview
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files - clear preview since we'll upload directly
      setNewPhoto(prev => ({ ...prev, image: '' }));
    }
  };

  const processFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const baseTitle = newPhoto.title || '결혼식 사진';
    
    try {
      console.log('=== WEDDING: Starting file upload process ===');
      console.log('Files to upload:', selectedFiles.length);
      console.log('Base title:', baseTitle);
      
      if (selectedFiles.length === 1) {
        // Single file upload
        const file = selectedFiles[0];
        console.log('WEDDING: Uploading single file:', file.name, 'Size:', file.size);
        
        // Get dimensions from original file
        const dimensions = await getImageDimensions(file);
        console.log('WEDDING: File dimensions:', dimensions);
        
        const imageUrl = await uploadImage(file, { forceCloud: true });
        console.log('WEDDING: Image uploaded successfully, URL:', imageUrl.substring(0, 50) + '...');
        
        // Detect storage mode based on URL
        if (imageUrl.startsWith('data:')) {
          setStorageMode('local');
          console.warn('⚠️ Wedding photo stored locally - cloud upload may have failed');
        } else {
          setStorageMode('cloud');
          console.log('✅ Wedding photo stored in cloud successfully');
        }
        
        // Calculate aspect ratio from file dimensions
        const aspectRatio = getAspectRatioFromDimensions(dimensions.width, dimensions.height);
        console.log('WEDDING: Using file-based aspect ratio:', aspectRatio);
        
        const photo: WeddingPhoto = {
          id: Date.now().toString(),
          title: baseTitle,
          image: imageUrl,
          uploadDate: new Date().toLocaleDateString('ko-KR'),
          aspectRatio
        };

        console.log('WEDDING: Saving photo data:', photo);
        const updatedPhotos = [photo, ...photos];
        await savePhotos(updatedPhotos);
        console.log('WEDDING: Photo saved successfully');
      } else {
        // Multiple files upload
        console.log('WEDDING: Uploading multiple files:', selectedFiles.length);
        const newPhotosToAdd: WeddingPhoto[] = [];
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          console.log(`WEDDING: Uploading file ${i + 1}/${selectedFiles.length}:`, file.name);
          
          // Get dimensions from original file first
          const dimensions = await getImageDimensions(file);
          console.log(`WEDDING: File ${i + 1} dimensions:`, dimensions);
          
          const imageUrl = await uploadImage(file, { forceCloud: true });
          console.log(`WEDDING: File ${i + 1} uploaded successfully:`, imageUrl.substring(0, 50) + '...');
          
          // Detect storage mode based on URL (set only once for batch)
          if (i === 0) {
            if (imageUrl.startsWith('data:')) {
              setStorageMode('local');
              console.warn('⚠️ Wedding photos stored locally - cloud upload may have failed');
            } else {
              setStorageMode('cloud');
              console.log('✅ Wedding photos stored in cloud successfully');
            }
          }
          
          // Calculate aspect ratio from file dimensions
          const aspectRatio = getAspectRatioFromDimensions(dimensions.width, dimensions.height);
          console.log(`WEDDING: Using file-based aspect ratio for ${i + 1}:`, aspectRatio);
          
          const photo: WeddingPhoto = {
            id: `${Date.now()}_${i}`,
            title: `${baseTitle} ${i + 1}`,
            image: imageUrl,
            uploadDate: new Date().toLocaleDateString('ko-KR'),
            aspectRatio
          };
          newPhotosToAdd.push(photo);
          console.log(`WEDDING: Added photo ${i + 1} to batch:`, photo);
        }
        
        console.log('WEDDING: All files processed, saving batch:', newPhotosToAdd.length, 'photos');
        // Sort by id to maintain order
        newPhotosToAdd.sort((a, b) => a.id.localeCompare(b.id));
        const updatedPhotos = [...newPhotosToAdd, ...photos];
        await savePhotos(updatedPhotos);
        console.log('WEDDING: Batch saved successfully');
      }
    } catch (error) {
      console.error('=== WEDDING: Upload failed ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== End wedding upload error ===');
      
      alert(`이미지 업로드에 실패했습니다.\n\n에러 내용: ${error.message}\n\n개발자 도구의 콘솔에서 더 자세한 정보를 확인할 수 있습니다.`);
      return; // Don't reset form on error so user can retry
    }
    
    // Reset form only on success
    setNewPhoto({ title: '', image: '' });
    setSelectedFiles(null);
    setIsDialogOpen(false);
    
    // Show success message with storage info
    const storageInfo = storageMode === 'local' ? '로컬 저장소' : '클라우드 저장소';
    console.log(`=== WEDDING: Upload process completed successfully (${storageInfo}) ===`);
    
    // Optional: Show a brief success notification
    if (storageMode === 'local') {
      console.warn('⚠️ 클라우드 연결 문제로 이미지가 로컬에 저장되었습니다. 가능한 한 빨리 클라우드에 백업하는 것을 권장합니다.');
    } else {
      console.log('✅ 결혼식 사진이 안전하게 클라우드 데이터베이스에 저장되었습니다.');
    }
  };

  const deletePhoto = async (id: string) => {
    if (confirm('정말 이 사진을 삭제하시겠습니까?')) {
      const updatedPhotos = photos.filter(photo => photo.id !== id);
      await savePhotos(updatedPhotos);
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedPhotos(new Set());
  };

  const togglePhotoSelection = (id: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAllPhotos = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(photo => photo.id)));
    }
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;
    
    if (confirm(`선택된 ${selectedPhotos.size}개의 사진을 삭제하시겠습니까?`)) {
      const updatedPhotos = photos.filter(photo => !selectedPhotos.has(photo.id));
      await savePhotos(updatedPhotos);
      setSelectedPhotos(new Set());
      setIsDeleteMode(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3>결혼식 사진</h3>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">우리의 특별한 날의 아름다운 순간들</p>
            {storageMode === 'local' && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded" title="클라우드 연결 실패로 이미지가 브라우저에 저장되었습니다. 브라우저 데이터를 삭제하면 사진이 사라질 수 있습니다.">
                ⚠️ 로컬 저장
              </span>
            )}
            {storageMode === 'cloud' && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded" title="결혼식 사진이 클라우드 데이터베이스에 안전하게 저장되었습니다.">
                ☁️ 클라우드 저장
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isDeleteMode ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testAPIConnection} 
                className="flex items-center gap-1 text-xs"
                title="API 연결 상태 테스트"
              >
                🔧 테스트
              </Button>
              {storageMode === 'local' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={manageLocalStorage} 
                  className="flex items-center gap-1 text-xs"
                  title="로컬 저장소 관리"
                >
                  <HardDrive className="h-3 w-3" />
                  저장소
                </Button>
              )}
              <Button variant="outline" onClick={toggleDeleteMode} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    사진 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>결혼식 사진 업로드</DialogTitle>
                    <DialogDescription>
                      결혼식 사진을 업로드해주세요. 사진은 클라우드 데이터베이스에 안전하게 저장됩니다.
                      <br />
                      <span className="text-xs text-muted-foreground mt-1 block">
                        권장: 2MB 이하의 이미지 (큰 파일은 자동으로 압축됩니다)
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-3 sm:space-y-4 p-1 sm:p-0">
                    <Input
                      placeholder="사진 제목을 입력하세요 (여러장 업로드시 자동으로 번호가 붙습니다)"
                      value={newPhoto.title}
                      onChange={(e) => setNewPhoto(prev => ({ ...prev, title: e.target.value }))}
                      className="text-sm sm:text-base"
                    />

                    <div className="space-y-3">
                      <label className="block">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">결혼식 사진 업로드 (여러장 선택 가능)</span>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          required
                          className="text-sm"
                        />
                      </label>
                      
                      {newPhoto.image && (
                        <div className="mt-3">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">미리보기:</p>
                          <ImageWithFallback
                            src={newPhoto.image}
                            alt="Preview"
                            className="w-full max-w-xs sm:max-w-md h-48 sm:h-64 object-contain bg-muted rounded-lg mx-auto block"
                          />
                        </div>
                      )}
                      
                      {selectedFiles && selectedFiles.length > 1 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            📸 선택된 파일: <strong>{selectedFiles.length}장</strong>
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                            {Array.from(selectedFiles).slice(0, 4).map((file, index) => (
                              <div key={index}>• {file.name}</div>
                            ))}
                            {selectedFiles.length > 4 && (
                              <div>... 그 외 {selectedFiles.length - 4}개 파일</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm">
                        취소
                      </Button>
                      <Button onClick={handleSubmit} disabled={!newPhoto.title.trim() || (!selectedFiles && !newPhoto.image)} size="sm">
                        업로드
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={selectAllPhotos}
                className="flex items-center gap-2"
              >
                {selectedPhotos.size === photos.length ? '전체 해제' : '전체 선택'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteSelectedPhotos}
                disabled={selectedPhotos.size === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                삭제 ({selectedPhotos.size})
              </Button>
              <Button variant="outline" onClick={toggleDeleteMode}>
                취소
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">아직 업로드된 사진이 없습니다</p>
              <p className="text-sm text-muted-foreground">첫 번째 결혼식 사진을 업로드해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <Masonry columnsCount={4} gutter="16px">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <Card className="overflow-hidden">
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      style={{
                        aspectRatio: photo.aspectRatio || 'auto'
                      }}
                      onClick={() => !isDeleteMode && setSelectedPhoto(photo)}
                    />
                    
                    {/* Delete mode checkbox */}
                    {isDeleteMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedPhotos.has(photo.id)}
                          onChange={() => togglePhotoSelection(photo.id)}
                          className="w-5 h-5 rounded border-2 border-white bg-white/90 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    {/* Normal delete button */}
                    {!isDeleteMode && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePhoto(photo.id);
                          }}
                          className="shadow-lg"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Overlay with title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 text-white">
                        <Heart className="h-4 w-4 text-red-400" />
                        <p className="font-medium text-sm">{photo.title}</p>
                      </div>
                      <p className="text-xs text-white/80 mt-1">
                        {photo.uploadDate}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Masonry>
        )}
      </div>

      {photos.length > 0 && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            총 {photos.length}장의 소중한 추억이 저장되었습니다 💕
          </p>
          {storageMode === 'local' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ⚠️ <strong>로컬 저장 모드 (백업 필요)</strong><br/>
                클라우드 연결 문제로 사진이 브라우저에 저장되었습니다.<br/>
                가능한 한 빨리 클라우드에 백업하는 것을 권장합니다.
              </p>
            </div>
          )}
          {storageMode === 'cloud' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-green-700 dark:text-green-300">
                ✅ <strong>클라우드 저장</strong><br/>
                모든 결혼식 사진이 클라우드 데이터베이스에 안전하게 저장되었습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <ImageWithFallback
              src={selectedPhoto.image}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{
                maxWidth: 'min(90vw, calc(90vh * var(--aspect-ratio, 1)))',
                maxHeight: 'min(90vh, calc(90vw / var(--aspect-ratio, 1)))',
                '--aspect-ratio': selectedPhoto.aspectRatio || 1
              } as React.CSSProperties}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Close button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black shadow-lg z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              ×
            </Button>
            
            {/* Photo info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-red-400" />
                <p className="font-medium">{selectedPhoto.title}</p>
              </div>
              <p className="text-sm text-white/80">
                업로드: {selectedPhoto.uploadDate}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}