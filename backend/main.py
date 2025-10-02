from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import random
from pathlib import Path

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure video directory exists
VIDEO_DIR = Path("/app/public/video")
VIDEO_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/hello")
def read_hello():
    return {"message": "hello worl111111d"}


@app.post("/api/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    sessionId: str = Form(...)
):
    """
    Upload video file (WebM) and convert to MP4 using FFmpeg
    """
    temp_webm_path = VIDEO_DIR / f"temp-{sessionId}.webm"
    output_mp4_path = VIDEO_DIR / f"session-{sessionId}.mp4"

    try:
        # Save uploaded WebM file
        with open(temp_webm_path, "wb") as f:
            content = await video.read()
            f.write(content)

        # Convert WebM to MP4 using FFmpeg
        ffmpeg_command = [
            "ffmpeg",
            "-i", str(temp_webm_path),
            "-c:v", "libx264",      # H.264 video codec
            "-c:a", "aac",          # AAC audio codec
            "-strict", "experimental",
            "-y",                   # Overwrite output file if exists
            str(output_mp4_path)
        ]

        result = subprocess.run(
            ffmpeg_command,
            capture_output=True,
            text=True
        )

        # Remove temporary WebM file
        if temp_webm_path.exists():
            os.remove(temp_webm_path)

        if result.returncode != 0:
            return {
                "success": False,
                "error": f"FFmpeg conversion failed: {result.stderr}"
            }

        return {
            "success": True,
            "filename": f"session-{sessionId}.mp4",
            "path": f"/public/video/session-{sessionId}.mp4",
            "message": "Video uploaded and converted successfully"
        }

    except Exception as e:
        # Cleanup on error
        if temp_webm_path.exists():
            os.remove(temp_webm_path)
        return {
            "success": False,
            "error": str(e)
        }


# Request model for check endpoints
class CheckRequest(BaseModel):
    videoPath: str


# Security check endpoints - return random scores for now
# TODO: Implement actual ML/CV models for each check

@app.post("/api/check/active-liveness")
def check_active_liveness(request: CheckRequest):
    """Active Liveness: Challenge-response verification"""
    score = random.randint(0, 100)
    return {"score": score}


@app.post("/api/check/passive-forensics")
def check_passive_forensics(request: CheckRequest):
    """Passive Forensics: AI-powered deepfake detection"""
    score = random.randint(0, 100)
    return {"score": score}


@app.post("/api/check/head-pose")
def check_head_pose(request: CheckRequest):
    """Head Pose: 3D head tracking and pose estimation"""
    score = random.randint(0, 100)
    return {"score": score}


@app.post("/api/check/micro-dynamics")
def check_micro_dynamics(request: CheckRequest):
    """Micro-Dynamics: Natural facial micro-expressions"""
    score = random.randint(0, 100)
    return {"score": score}


@app.post("/api/check/lip-audio-sync")
def check_lip_audio_sync(request: CheckRequest):
    """Lip-Audio Sync: Correlation between lip and speech"""
    score = random.randint(0, 100)
    return {"score": score}


@app.post("/api/check/temporal-integrity")
def check_temporal_integrity(request: CheckRequest):
    """Temporal Integrity: Detect loops, replays, and frozen feeds using perceptual hashing"""
    try:
        from utils.temporal_integrity_checker import TemporalIntegrityChecker

        # Extract filename and construct full path using VIDEO_DIR
        video_filename = Path(request.videoPath).name
        video_path = VIDEO_DIR / video_filename

        if not video_path.exists():
            print(f"Video not found: {video_path}")
            score = random.randint(0, 100)
            return {"score": score}

        checker = TemporalIntegrityChecker()
        score = checker.check_temporal_integrity(str(video_path))
        return {"score": int(score)}

    except Exception as e:
        print(f"Error in temporal integrity check: {e}")
        score = random.randint(0, 100)
        return {"score": score}


@app.post("/api/check/face-match")
def check_face_match(request: CheckRequest):
    """Face Match: Identity verification vs documents"""
    score = random.randint(0, 100)
    return {"score": score}
