// src/lib/frameExtraction.ts
// Purpose: Takes a video file, plays it internally, and snaps photos (frames)
// Project relative path: src/lib/frameExtraction.ts

export async function extractFramesFromVideo(
  videoFile: File,
  intervalSeconds: number = 2
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const frames: string[] = [];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a URL for the video file so the browser can play it
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    // Essential for iOS/Safari to allow processing without playing on screen
    video.playsInline = true;
    video.muted = true;
    video.crossOrigin = 'anonymous';

    // Wait for video to load metadata (duration, dimensions)
    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      let currentTime = 0;

      // Helper function to capture a single frame
      const captureFrame = async () => {
        // If we've reached the end, finish up
        if (currentTime >= duration) {
          URL.revokeObjectURL(videoUrl); // Clean up memory
          resolve(frames);
          return;
        }

        // Seek the video to the specific time
        video.currentTime = currentTime;

        // Wait for the video to seek
        await new Promise<void>((r) => {
          video.onseeked = () => r();
        });

        // Draw the current video frame onto the canvas
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Convert to a base64 image string (like a text version of an image)
          const frameData = canvas.toDataURL('image/jpeg', 0.7); // 0.7 = 70% quality
          frames.push(frameData);
        }

        // Move time forward
        currentTime += intervalSeconds;
        captureFrame(); // Recursively call for the next frame
      };

      // Start the loop
      captureFrame();
    };

    video.onerror = (e) => {
      reject("Error loading video: " + e);
    };
  });
}
// File length: ~1600 chars