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

// --- Chunked Extraction Types ---

export interface ChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  frames: string[];
  allFramesSoFar: string[];
}

export interface ChunkedExtractionOptions {
  chunkSize?: number; // Default: 4 frames per chunk
  intervalSeconds?: number; // Default: 2 seconds between frames
  totalFrames?: number; // Default: 16 total frames
  onChunkReady?: (chunk: ChunkInfo) => void;
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

/**
 * Extract frames in chunks for streaming analysis.
 * Fires onChunkReady callback after each chunk of frames is extracted.
 *
 * Default: 4 chunks of 4 frames = 16 total frames
 */
export async function extractFramesChunked(
  videoFile: File,
  options: ChunkedExtractionOptions = {}
): Promise<string[]> {
  const chunkSize = options.chunkSize ?? 4;
  const totalFramesTarget = options.totalFrames ?? 16;
  const onChunkReady = options.onChunkReady;
  const onProgress = options.onProgress;
  const onMetadataLoaded = options.onMetadataLoaded;

  return new Promise((resolve, reject) => {
    const allFrames: string[] = [];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    console.log("frameExtraction: Created video element for chunked extraction");

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.playsInline = true;
    video.muted = true;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;

      // Calculate interval to get exactly totalFramesTarget frames spread across the video
      const intervalSeconds = duration / totalFramesTarget;
      const totalFrames = totalFramesTarget;
      const totalChunks = Math.ceil(totalFrames / chunkSize);

      console.log("frameExtraction (chunked): duration:", duration,
                  "interval:", intervalSeconds.toFixed(2),
                  "totalFrames:", totalFrames,
                  "chunks:", totalChunks);

      if (onMetadataLoaded) {
        onMetadataLoaded({ duration, totalFrames });
      }

      let currentFrameIndex = 0;
      let currentChunkIndex = 0;
      let currentChunkFrames: string[] = [];

      const captureNextFrame = async () => {
        // Check if we've captured all frames
        if (currentFrameIndex >= totalFrames) {
          console.log("frameExtraction (chunked): Complete, total frames:", allFrames.length);
          URL.revokeObjectURL(videoUrl);
          resolve(allFrames);
          return;
        }

        // Calculate the time for this frame
        const currentTime = currentFrameIndex * intervalSeconds;

        // Seek to the time
        video.currentTime = currentTime;
        await new Promise<void>((r) => {
          video.onseeked = () => r();
        });

        // Capture the frame
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.7);

          allFrames.push(frameData);
          currentChunkFrames.push(frameData);

          // Report progress
          if (onProgress) {
            onProgress({
              currentFrame: currentFrameIndex + 1,
              totalFrames,
              currentTime,
              duration,
            });
          }
        }

        currentFrameIndex++;

        // Check if we've completed a chunk
        if (currentChunkFrames.length >= chunkSize || currentFrameIndex >= totalFrames) {
          if (onChunkReady && currentChunkFrames.length > 0) {
            console.log(`frameExtraction: Chunk ${currentChunkIndex + 1}/${totalChunks} ready with ${currentChunkFrames.length} frames`);
            onChunkReady({
              chunkIndex: currentChunkIndex,
              totalChunks,
              frames: [...currentChunkFrames],
              allFramesSoFar: [...allFrames],
            });
          }
          currentChunkIndex++;
          currentChunkFrames = [];
        }

        // Capture next frame
        captureNextFrame();
      };

      // Start capturing
      captureNextFrame();
    };

    video.onerror = (e) => {
      console.error("frameExtraction (chunked): Error loading video:", e);
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Error loading video. Please try a different file format."));
    };
  });
}