import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err.message);
  return c.json({ 
    error: 'Internal server error', 
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500);
});

// CORS middleware with comprehensive configuration
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  exposeHeaders: ['Content-Type', 'Content-Length'],
  credentials: false
}));

// Logger middleware
app.use('*', logger());

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Health check - simple endpoint first
app.get('/make-server-38b6a643/health', (c) => {
  console.log('Health check requested');
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Test endpoint to debug what's happening
app.get('/make-server-38b6a643/test', (c) => {
  console.log('Test endpoint called');
  return c.json({ 
    message: 'Test endpoint working',
    env: {
      hasUrl: !!Deno.env.get('SUPABASE_URL'),
      hasKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    }
  });
});

// Simple upload endpoint - no storage, just echo back for testing
app.post('/make-server-38b6a643/upload-test', async (c) => {
  try {
    console.log('Upload test endpoint called');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    return c.json({
      message: 'File received successfully',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: 'test-url-placeholder'
    });
  } catch (error) {
    console.error('Upload test error:', error);
    return c.json({ error: 'Upload test failed', details: error.message }, 500);
  }
});

// Image upload endpoint with KV store fallback (bypassing problematic Supabase Storage)
app.post('/make-server-38b6a643/upload-image', async (c) => {
  try {
    console.log('=== Image Upload Started ===');
    
    // Set response headers to ensure JSON
    c.header('Content-Type', 'application/json');
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file provided');
      return c.json({ error: 'No file provided' }, 400);
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file size (max 2MB for KV storage)
    const maxSize = 2 * 1024 * 1024; // 2MB - more conservative for KV storage
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return c.json({ 
        error: 'File too large', 
        message: 'File size must be less than 2MB',
        size: file.size,
        maxSize: maxSize
      }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `wedding_${timestamp}_${randomString}.${fileExtension}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert File to base64 for KV storage
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64String}`;
    
    console.log('File converted to base64, length:', dataUrl.length);
    
    // Store in KV store instead of Supabase Storage
    console.log('Storing image in KV store...');
    
    const imageData = {
      fileName: fileName,
      originalName: file.name,
      contentType: file.type || 'image/jpeg',
      size: file.size,
      dataUrl: dataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'wedding_section'
    };
    
    // Use KV store for reliable storage
    await kv.set(`image:${fileName}`, JSON.stringify(imageData));
    
    console.log('Image stored in KV store successfully');
    
    // Create a direct URL that we can serve from our KV store
    const imageUrl = `${c.req.url.replace('/upload-image', '')}/get-image/${fileName}`;
    
    console.log('Generated KV image URL:', imageUrl);
    console.log('=== Image Upload Complete (KV Storage) ===');

    return c.json({ 
      fileName: fileName,
      url: imageUrl,
      path: fileName,
      success: true,
      storage: 'kv_store',
      message: 'Image stored in KV database (bypassing Supabase Storage issues)'
    });
    
  } catch (error) {
    console.error('Critical upload error:', error);
    
    // Ensure we always return JSON
    try {
      return c.json({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString(),
        suggestion: 'Try uploading a smaller image (under 1MB) or contact support'
      }, 500);
    } catch (jsonError) {
      console.error('Failed to return JSON error:', jsonError);
      // Last resort - return text response
      return new Response(JSON.stringify({
        error: 'Critical server error',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});

// Serve images from KV store
app.get('/make-server-38b6a643/get-image/:fileName', async (c) => {
  try {
    const fileName = c.req.param('fileName');
    console.log('Serving image from KV store:', fileName);
    
    const imageDataString = await kv.get(`image:${fileName}`);
    
    if (!imageDataString) {
      return c.json({ error: 'Image not found' }, 404);
    }
    
    const imageData = JSON.parse(imageDataString);
    const dataUrl = imageData.dataUrl;
    
    // Extract base64 data and content type
    const [header, base64Data] = dataUrl.split(',');
    const contentType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    
    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('Serving image, content type:', contentType, 'size:', bytes.length);
    
    return new Response(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': bytes.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Error serving image:', error);
    return c.json({ error: 'Failed to serve image', details: error.message }, 500);
  }
});

// Save data to KV store
app.post('/make-server-38b6a643/save-data', async (c) => {
  try {
    console.log('Save data request');
    const { key, data } = await c.req.json();
    
    if (!key || !data) {
      return c.json({ error: 'Key and data are required' }, 400);
    }

    console.log('Saving data for key:', key);
    await kv.set(key, JSON.stringify(data));
    console.log('Data saved successfully');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Save data error:', error);
    return c.json({ error: 'Failed to save data', details: error.message }, 500);
  }
});

// Get data from KV store
app.get('/make-server-38b6a643/get-data/:key', async (c) => {
  try {
    console.log('Get data request');
    const key = c.req.param('key');
    console.log('Getting data for key:', key);
    
    const data = await kv.get(key);
    
    if (!data) {
      console.log('No data found for key:', key);
      return c.json({ data: null });
    }

    const parsedData = JSON.parse(data);
    console.log('Data retrieved successfully');
    
    return c.json({ data: parsedData });
  } catch (error) {
    console.error('Get data error:', error);
    return c.json({ error: 'Failed to get data', details: error.message }, 500);
  }
});

// Create user endpoint
app.post('/make-server-38b6a643/create-user', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Only allow creating the authorized email
    const allowedEmail = 'rlawnsrhkd@gmail.com';
    if (email !== allowedEmail) {
      return c.json({ error: 'Unauthorized email address' }, 403);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers.users.find(user => user.email === email);
    
    if (userExists) {
      return c.json({ message: 'User already exists', user: userExists });
    }

    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { 
        full_name: '김준광',
        name: '김준광'
      },
      email_confirm: true
    });

    if (error) {
      console.error('User creation error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: 'User created successfully',
      user: data.user
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Check auth endpoint
app.post('/make-server-38b6a643/check-auth', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Check if the user's email is the allowed one
    const allowedEmail = 'rlawnsrhkd@gmail.com';
    if (user.email !== allowedEmail) {
      return c.json({ 
        error: 'Unauthorized email address',
        message: 'Only the site owner can access this application'
      }, 403);
    }

    return c.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || '김준광'
      }
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Handle routes without the prefix (redirect to prefixed version)
app.post('/upload-image', async (c) => {
  console.log('Non-prefixed upload-image route hit, redirecting...');
  return c.redirect('/make-server-38b6a643/upload-image', 301);
});

app.get('/health', (c) => {
  console.log('Non-prefixed health route hit, redirecting...');
  return c.redirect('/make-server-38b6a643/health', 301);
});

// Catch all unmatched routes
app.all('*', (c) => {
  console.log('Unmatched route:', c.req.method, c.req.url);
  
  // Always return JSON, never HTML
  c.header('Content-Type', 'application/json');
  
  return c.json({ 
    error: 'Route not found',
    message: 'This endpoint does not exist',
    method: c.req.method,
    path: c.req.url,
    availableRoutes: [
      '/make-server-38b6a643/health',
      '/make-server-38b6a643/test', 
      '/make-server-38b6a643/upload-image',
      '/make-server-38b6a643/save-data',
      '/make-server-38b6a643/get-data/:key'
    ]
  }, 404);
});

console.log('Server starting...');

export default {
  fetch: app.fetch
};

Deno.serve(app.fetch);