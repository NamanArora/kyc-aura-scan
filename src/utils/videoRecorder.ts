/**
 * Video recording utilities for KYC live sessions
 */

export interface RecordingOptions {
  duration: number; // Duration in milliseconds
  mimeType?: string;
  videoBitsPerSecond?: number;
}

export interface UploadResult {
  success: boolean;
  filename?: string;
  path?: string;
  message?: string;
  error?: string;
}

/**
 * Record video from MediaStream for specified duration
 * @param stream - MediaStream from camera
 * @param duration - Recording duration in milliseconds
 * @returns Promise that resolves with recorded video Blob
 */
export function recordVideo(
  stream: MediaStream,
  duration: number = 15000
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: BlobPart[] = [];

    console.log('Starting MediaRecorder with duration:', duration);

    // Configure MediaRecorder with WebM format (widely supported)
    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    };

    let mediaRecorder: MediaRecorder;

    try {
      mediaRecorder = new MediaRecorder(stream, options);
      console.log('MediaRecorder created with options:', options);
    } catch (e) {
      // Fallback to default if codec not supported
      console.warn('Failed to create MediaRecorder with options, using default:', e);
      mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        console.log('Data chunk received, size:', event.data.size);
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('MediaRecorder stopped, total chunks:', chunks.length);
      const blob = new Blob(chunks, { type: 'video/webm' });
      console.log('Final blob created, size:', blob.size);
      resolve(blob);
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      reject(new Error(`MediaRecorder error: ${event}`));
    };

    // Start recording - request data every 1 second
    mediaRecorder.start(1000);
    console.log('MediaRecorder started, state:', mediaRecorder.state);

    // Auto-stop after specified duration
    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        console.log('Stopping MediaRecorder after', duration, 'ms');
        mediaRecorder.stop();
      }
    }, duration);
  });
}

/**
 * Upload recorded video blob to backend
 * @param blob - Video blob to upload
 * @param sessionId - KYC session ID
 * @returns Promise with upload result
 */
export async function uploadVideoToBackend(
  blob: Blob,
  sessionId: string
): Promise<UploadResult> {
  try {
    console.log('Uploading video blob:', {
      size: blob.size,
      type: blob.type,
      sessionId: sessionId
    });

    const formData = new FormData();
    formData.append('video', blob, `video-${sessionId}.webm`);
    formData.append('sessionId', sessionId);

    console.log('Sending POST request to http://localhost:8000/api/upload-video');

    const response = await fetch('http://localhost:8000/api/upload-video', {
      method: 'POST',
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with response:', errorText);
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Upload successful, result:', result);
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Record video and upload to backend in one operation
 * @param stream - MediaStream from camera
 * @param sessionId - KYC session ID
 * @param duration - Recording duration in milliseconds (default: 15000)
 * @param onProgress - Optional callback for recording progress updates
 * @returns Promise with upload result
 */
export async function recordAndUpload(
  stream: MediaStream,
  sessionId: string,
  duration: number = 15000,
  onProgress?: (secondsRemaining: number) => void
): Promise<UploadResult> {
  try {
    console.log('=== recordAndUpload started ===');
    console.log('Session ID:', sessionId);
    console.log('Duration:', duration);

    // Start progress updates if callback provided
    let progressInterval: NodeJS.Timeout | null = null;
    if (onProgress) {
      let elapsed = 0;
      onProgress(15); // Initial value
      progressInterval = setInterval(() => {
        elapsed += 1000;
        const remaining = Math.ceil((duration - elapsed) / 1000);
        onProgress(remaining > 0 ? remaining : 0);
      }, 1000);
    }

    // Record video
    console.log('Starting video recording...');
    const blob = await recordVideo(stream, duration);
    console.log('Video recording completed, blob size:', blob.size);

    // Clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Upload to backend
    console.log('Starting upload to backend...');
    const result = await uploadVideoToBackend(blob, sessionId);
    console.log('Upload completed, result:', result);
    console.log('=== recordAndUpload finished ===');
    return result;
  } catch (error) {
    console.error('=== recordAndUpload error ===', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Recording failed',
    };
  }
}
