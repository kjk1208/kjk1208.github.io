import { projectId, publicAnonKey } from './supabase/info';

// API base URL for Supabase edge functions
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-38b6a643`;

// Convert file to base64 string for local storage fallback
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Check if localStorage has enough space for a given data size
function checkLocalStorageSpace(dataSize: number): boolean {
  try {
    // Get current localStorage usage
    let currentSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentSize += localStorage[key].length + key.length;
      }
    }
    
    // Estimate total size needed (current + new data + some buffer)
    const totalNeeded = currentSize + dataSize + (1024 * 1024); // 1MB buffer
    const maxStorage = 10 * 1024 * 1024; // Assume 10MB limit (conservative estimate)
    
    console.log(`LocalStorage usage: ${(currentSize / 1024 / 1024).toFixed(1)}MB, Adding: ${(dataSize / 1024 / 1024).toFixed(1)}MB, Max: ${(maxStorage / 1024 / 1024).toFixed(1)}MB`);
    
    return totalNeeded < maxStorage;
  } catch (error) {
    console.warn('Could not check localStorage space:', error);
    return false;
  }
}

// Clear old images from localStorage to make space
function clearOldImages(): number {
  let clearedCount = 0;
  let clearedSize = 0;
  
  try {
    const imageKeys: string[] = [];
    
    // Find all image keys
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('image_')) {
        imageKeys.push(key);
      }
    }
    
    // Sort by timestamp (older first) and remove oldest 50%
    imageKeys.sort();
    const keysToRemove = imageKeys.slice(0, Math.floor(imageKeys.length / 2));
    
    keysToRemove.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        clearedSize += value.length;
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`Cleared ${clearedCount} old images, freed ${(clearedSize / 1024 / 1024).toFixed(1)}MB`);
  } catch (error) {
    console.warn('Error clearing old images:', error);
  }
  
  return clearedCount;
}

// Compress image if it's too large
function compressImage(file: File, maxSizeKB = 1024, forLocal = false): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // For local storage, be more aggressive with compression
      const maxDimension = forLocal ? 1200 : 1920;
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // For local storage, start with lower quality
      let quality = forLocal ? 0.6 : 0.8;
      const minQuality = forLocal ? 0.2 : 0.3;
      const targetSize = forLocal ? maxSizeKB / 2 : maxSizeKB; // More aggressive for local
      
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Return original if compression fails
            return;
          }
          
          const compressedSizeKB = blob.size / 1024;
          
          if (compressedSizeKB <= targetSize || quality <= minQuality) {
            // Good enough or we've tried hard enough
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            // Try with lower quality
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress();
    };
    
    img.onerror = () => resolve(file); // Return original if image load fails
    img.src = URL.createObjectURL(file);
  });
}

// Safe upload wrapper that catches ALL errors
async function safeUploadToSupabase(file: File, forceCloud: boolean = false): Promise<string | null> {
  try {
    // Skip Supabase unless forceCloud is true
    if (!forceCloud) {
      return null;
    }
    
    // Check file size before upload - server has 2MB limit now
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 2) {
      console.log(`📦 File too large for cloud storage (${fileSizeMB.toFixed(1)}MB), compressing...`);
      file = await compressImage(file, 512); // Compress to ~512KB for cloud storage
      const newSizeMB = file.size / 1024 / 1024;
      console.log(`✅ Compressed to ${newSizeMB.toFixed(1)}MB for cloud upload`);
    }

    console.log('🌐 Attempting cloud upload (KV storage):', file.name, `(${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      },
      body: formData,
      signal: AbortSignal.timeout(120000) // 2 minutes timeout
    });

    console.log('Upload response status:', response.status);

    // Always try to parse as JSON first
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Server returned non-JSON response');
      const responseText = await response.text();
      console.error('Response text (first 500 chars):', responseText.substring(0, 500));
      return null;
    }

    if (!response.ok) {
      console.error('Upload failed with status:', response.status);
      console.error('Error data:', result);
      
      // Provide helpful error messages
      if (result.error?.includes('too large')) {
        console.error('File size exceeded server limit');
      } else if (result.error?.includes('storage')) {
        console.error('Server storage issue detected');
      }
      
      return null;
    }

    console.log('Upload response:', result);
    
    if (result.url) {
      console.log(`✅ Cloud upload successful (${result.storage || 'server'}):`, result.url);
      if (result.message) {
        console.log('ℹ️ Server message:', result.message);
      }
      return result.url;
    } else {
      console.warn('No URL in response:', result);
      return null;
    }
    
  } catch (error) {
    console.error('Upload request failed:', error);
    
    // Provide more detailed error information
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('Network error - check internet connection');
    } else if (error.message.includes('signal timed out')) {
      console.error('Upload timeout - try a smaller file or check connection speed');
    } else if (error.name === 'AbortError') {
      console.error('Upload was aborted');
    }
    
    return null;
  }
}

// Upload image - with option to force cloud storage
export async function uploadImage(file: File, options: { forceCloud?: boolean } = {}): Promise<string> {
  const { forceCloud = false } = options;
  
  if (forceCloud) {
    console.log('☁️ Processing image for cloud storage:', file.name, `(${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  } else {
    console.log('📱 Processing image for local storage:', file.name, `(${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  // Check file size - limit to 10MB for initial upload, we'll compress if needed
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.');
  }

  // Try Supabase upload first if forceCloud is true
  const supabaseUrl = await safeUploadToSupabase(file, forceCloud);
  
  if (supabaseUrl) {
    console.log('✅ Image uploaded to cloud storage');
    return supabaseUrl;
  }
  
  // If forceCloud was requested but failed, show warning
  if (forceCloud) {
    console.warn('⚠️ Cloud upload failed, falling back to local storage');
  }
  
  // Using base64 + localStorage (local storage mode active)
  
  try {
    let fileToProcess = file;
    
    // For local storage, be more aggressive with compression
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 0.5) { // Compress anything over 500KB for local storage
      console.log(`📦 Compressing image for local storage (${fileSizeMB.toFixed(1)}MB)...`);
      fileToProcess = await compressImage(file, 512, true); // Compress to ~512KB, local mode
      const newSizeMB = fileToProcess.size / 1024 / 1024;
      console.log(`✅ Compressed to ${newSizeMB.toFixed(1)}MB`);
    }
    
    // Convert to base64 for browser storage
    console.log('Converting to base64...');
    const base64 = await fileToBase64(fileToProcess);
    
    // Check if we have enough space (base64 is ~33% larger than binary)
    const base64Size = base64.length;
    const estimatedSize = Math.floor(base64Size * 1.33); // Add some buffer
    
    if (!checkLocalStorageSpace(estimatedSize)) {
      console.warn('⚠️ Insufficient localStorage space, clearing old images...');
      const clearedCount = clearOldImages();
      
      if (clearedCount === 0) {
        throw new Error('로컬 저장소 공간이 부족합니다. 브라우저 설정에서 사이트 데이터를 삭제하거나 다른 브라우저를 사용해 주세요.');
      }
      
      // Check again after clearing
      if (!checkLocalStorageSpace(estimatedSize)) {
        throw new Error('로컬 저장소 공간이 부족합니다. 이미지를 더 압축하거나 기존 데이터를 삭제해 주세요.');
      }
    }
    
    // Store in localStorage with unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const imageKey = `image_${timestamp}_${randomString}`;
    
    try {
      localStorage.setItem(imageKey, base64);
      console.log(`✅ Image stored locally (${(base64Size / 1024 / 1024).toFixed(1)}MB)`);
    } catch (storageError) {
      if (storageError.name === 'QuotaExceededError') {
        // Last resort: try clearing more space
        console.warn('⚠️ Storage quota exceeded, clearing more space...');
        clearOldImages();
        
        // Try one more time with additional compression
        console.log('📦 Attempting additional compression...');
        fileToProcess = await compressImage(fileToProcess, 256, true); // Even more aggressive
        const newBase64 = await fileToBase64(fileToProcess);
        
        localStorage.setItem(imageKey, newBase64);
        console.log(`✅ Image stored locally with additional compression (${(newBase64.length / 1024 / 1024).toFixed(1)}MB)`);
        return newBase64;
      } else {
        throw storageError;
      }
    }
    
    // Return the base64 data
    return base64;
    
  } catch (fallbackError) {
    console.error('❌ Fallback storage also failed:', fallbackError);
    
    // Provide more specific error messages
    let errorMessage = '이미지 업로드에 실패했습니다';
    
    if (fallbackError.name === 'QuotaExceededError' || fallbackError.message.includes('localStorage')) {
      errorMessage = '로컬 저장소 공간이 부족합니다. 브라우저 설정에서 사이트 데이터를 삭제하거나 더 작은 이미지를 업로드해 주세요.';
    } else if (fallbackError.message.includes('compress')) {
      errorMessage = '이미지 압축에 실패했습니다. 다른 이미지를 시도해 주세요.';
    }
    
    throw new Error(`${errorMessage}: ${fallbackError.message}`);
  }
}

// Safe save to Supabase wrapper
async function safeSaveToSupabase(key: string, data: any, forceCloud: boolean = false): Promise<boolean> {
  try {
    // Skip Supabase unless forceCloud is true
    if (!forceCloud) {
      return false;
    }
    
    console.log('🌐 Attempting Supabase data save:', key);
    
    const response = await fetch(`${API_BASE_URL}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ key, data }),
      signal: AbortSignal.timeout(60000) // Increased timeout for data saving
    });

    if (response.ok) {
      console.log('✅ Data saved to Supabase successfully');
      return true;
    } else {
      console.warn('Supabase save failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('Supabase save request failed:', error.message);
    return false;
  }
}

// Save data - with option to force cloud storage
export async function saveData(key: string, data: any, options: { forceCloud?: boolean } = {}): Promise<void> {
  const { forceCloud = false } = options;
  
  if (forceCloud) {
    console.log('☁️ Saving data to cloud:', key, `(${Array.isArray(data) ? data.length + ' items' : typeof data})`);
  } else {
    console.log('📱 Saving data to localStorage:', key, `(${Array.isArray(data) ? data.length + ' items' : typeof data})`);
  }
  
  // Try Supabase first if forceCloud is true
  const supabaseSuccess = await safeSaveToSupabase(key, data, forceCloud);
  
  if (supabaseSuccess) {
    console.log('✅ Data saved to cloud');
    return;
  }
  
  // If forceCloud was requested but failed, show warning
  if (forceCloud) {
    console.warn('⚠️ Cloud save failed, falling back to local storage');
  }
  
  // Using localStorage (local storage mode active)
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log('✅ Data saved locally');
  } catch (localError) {
    console.error('❌ localStorage save also failed:', localError);
    throw new Error(`데이터 저장에 실패했습니다: ${localError.message}`);
  }
}

// Safe get from Supabase wrapper
async function safeGetFromSupabase(key: string, forceCloud: boolean = false): Promise<any | null> {
  try {
    // Skip Supabase unless forceCloud is true
    if (!forceCloud) {
      return null;
    }
    
    console.log('🌐 Attempting Supabase data get:', key);
    
    const response = await fetch(`${API_BASE_URL}/get-data/${key}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      },
      signal: AbortSignal.timeout(60000) // Increased timeout for data retrieval
    });

    if (response.ok) {
      const responseText = await response.text();
      
      if (responseText.trim().startsWith('<')) {
        console.warn('Server returned HTML instead of JSON');
        return null;
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Data retrieved from Supabase successfully');
        return result.data;
      } catch (parseError) {
        console.warn('Failed to parse response as JSON:', parseError);
        return null;
      }
    } else {
      console.warn('Supabase get failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.warn('Supabase get request failed:', error.message);
    return null;
  }
}

// Get data - with option to try cloud storage first
export async function getData(key: string, options: { forceCloud?: boolean } = {}): Promise<any> {
  const { forceCloud = false } = options;
  
  if (forceCloud) {
    console.log('☁️ Getting data from cloud:', key);
  } else {
    console.log('📱 Getting data from localStorage:', key);
  }
  
  // Try Supabase first if forceCloud is true
  const supabaseData = await safeGetFromSupabase(key, forceCloud);
  
  if (supabaseData !== null) {
    console.log('✅ Data loaded from cloud');
    return supabaseData;
  }
  
  // If forceCloud was requested but failed, show warning
  if (forceCloud) {
    console.warn('⚠️ Cloud data not found or failed, falling back to local storage');
  }
  
  // Using localStorage (local storage mode active)
  
  try {
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsed = JSON.parse(localData);
      console.log('✅ Data loaded locally');
      return parsed;
    } else {
      console.log('ℹ️ No local data found for:', key);
      return null;
    }
  } catch (localError) {
    console.error('❌ localStorage get also failed:', localError);
    return null; // Return null instead of throwing to allow app to continue
  }
}

// Get multiple data items by prefix
export async function getDataByPrefix(prefix: string): Promise<Array<{key: string, data: any}>> {
  const response = await fetch(`${API_BASE_URL}/get-data-by-prefix/${prefix}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get data by prefix');
  }

  const result = await response.json();
  return result.results;
}

// Delete data from KV store
export async function deleteData(key: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/delete-data/${key}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete data');
  }
}