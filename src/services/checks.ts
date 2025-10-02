/**
 * KYC Security Checks API Service
 * Each function calls a backend endpoint to run a specific security check
 */

const API_BASE = "http://localhost:8000/api/check";
const API_ROOT = "http://localhost:8000/api";

interface CheckResponse {
  score: number;
}

interface VideoListResponse {
  videos: string[];
}

async function callCheck(checkName: string, videoPath: string): Promise<number> {
  const response = await fetch(`${API_BASE}/${checkName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoPath }),
  });
  if (!response.ok) throw new Error(`Check ${checkName} failed`);
  const data: CheckResponse = await response.json();
  return data.score;
}

export async function checkActiveLiveness(videoPath: string): Promise<number> {
  return callCheck("active-liveness", videoPath);
}

export async function checkPassiveForensics(videoPath: string): Promise<number> {
  return callCheck("passive-forensics", videoPath);
}

export async function checkHeadPose(videoPath: string): Promise<number> {
  return callCheck("head-pose", videoPath);
}

export async function checkMicroDynamics(videoPath: string): Promise<number> {
  return callCheck("micro-dynamics", videoPath);
}

export async function checkLipAudioSync(videoPath: string): Promise<number> {
  return callCheck("lip-audio-sync", videoPath);
}

export async function checkTemporalIntegrity(videoPath: string): Promise<number> {
  return callCheck("temporal-integrity", videoPath);
}

export async function checkFaceMatch(videoPath: string): Promise<number> {
  return callCheck("face-match", videoPath);
}

// Map check IDs to their respective functions
export const CHECK_FUNCTIONS: Record<string, (videoPath: string) => Promise<number>> = {
  "active-liveness": checkActiveLiveness,
  "passive-forensics": checkPassiveForensics,
  "head-pose": checkHeadPose,
  "micro-dynamics": checkMicroDynamics,
  "lip-audio-sync": checkLipAudioSync,
  "temporal-integrity": checkTemporalIntegrity,
  "face-match": checkFaceMatch,
};

/**
 * Fetch list of available videos from backend
 * @returns Array of video filenames
 */
export async function fetchVideoList(): Promise<string[]> {
  try {
    const response = await fetch(`${API_ROOT}/list-videos`);
    if (!response.ok) throw new Error("Failed to fetch video list");
    const data: VideoListResponse = await response.json();
    return data.videos;
  } catch (error) {
    console.error("Error fetching video list:", error);
    return [];
  }
}
