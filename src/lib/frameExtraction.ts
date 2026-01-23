// src/lib/frameExtraction.ts
// Purpose: Takes a video file, plays it internally, and snaps photos (frames)
// Project relative path: src/lib/frameExtraction.ts

export interface FrameExtractionProgress {
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  duration: number;
}

export interface FrameExtractionOptions {
  intervalSeconds?: number;
  onProgress?: (progress: FrameExtractionProgress) => void;
  onMetadataLoaded?: (info: { duration: number; totalFrames: number }) => void;
}

export async function extractFramesFromVideo(
  videoFile: File,
  intervalSecondsOrOptions: number | FrameExtractionOptions = 2
): Promise<string[]> {
  // Handle both old signature (number) and new signature (options object)
  const options: FrameExtractionOptions = typeof intervalSecondsOrOptions === 'number'
    ? { intervalSeconds: intervalSecondsOrOptions }
    : intervalSecondsOrOptions;

  const intervalSeconds = options.intervalSeconds ?? 2;
  const onProgress = options.onProgress;
  const onMetadataLoaded = options.onMetadataLoaded;

  return new Promise((resolve, reject) => {
    const frames: string[] = [];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    console.log("frameExtraction: Created video element");

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
      const totalFrames = Math.ceil(duration / intervalSeconds);
      let currentTime = 0;

      console.log("frameExtraction: Metadata loaded, duration:", duration, "totalFrames:", totalFrames);

      // Notify that metadata is loaded
      if (onMetadataLoaded) {
        onMetadataLoaded({ duration, totalFrames });
      }

      // Helper function to capture a single frame
      const captureFrame = async () => {
        // If we've reached the end, finish up
        if (currentTime >= duration) {
          console.log("frameExtraction: Complete, total frames:", frames.length);
          URL.revokeObjectURL(videoUrl); // Clean up memory
          resolve(frames);
          return;
        }

        console.log("frameExtraction: Capturing frame at", currentTime, "seconds");

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

          // Report progress
          if (onProgress) {
            onProgress({
              currentFrame: frames.length,
              totalFrames,
              currentTime,
              duration,
            });
          }
        }

        // Move time forward
        currentTime += intervalSeconds;
        captureFrame(); // Recursively call for the next frame
      };

      // Start the loop
      captureFrame();
    };

    video.onerror = (e) => {
      console.error("frameExtraction: Error loading video:", e);
      URL.revokeObjectURL(videoUrl); // Clean up memory
      reject(new Error("Error loading video. Please try a different file format."));
    };
  });
}
// File length: ~1600 chars