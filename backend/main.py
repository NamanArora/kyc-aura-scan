from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import subprocess
import os
import random
from pathlib import Path
from blink_detector import count_blinks
from head_pose_detector import head_pose_detection
from brightness_detector import detect_brightness_flash

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

# Mount static files to serve videos
app.mount("/public", StaticFiles(directory="/app/public"), name="public")


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


@app.get("/api/list-videos")
def list_videos():
    """
    List all MP4 video files available in the video directory
    """
    try:
        if not VIDEO_DIR.exists():
            return {"videos": []}

        # Get all .mp4 files in the video directory
        video_files = [f.name for f in VIDEO_DIR.glob("*.mp4")]

        # Sort by modification time (newest first)
        video_files.sort(key=lambda x: (VIDEO_DIR / x).stat().st_mtime, reverse=True)

        return {"videos": video_files}
    except Exception as e:
        print(f"Error listing videos: {e}")
        return {"videos": []}


# Request model for check endpoints
class CheckRequest(BaseModel):
    videoPath: str


# Security check endpoints - return random scores for now
# TODO: Implement actual ML/CV models for each check

@app.post("/api/check/active-liveness")
def check_active_liveness(request: CheckRequest):
    """Active Liveness: Challenge-response verification based on blink count"""
    try:
        # Extract video path and construct full path
        video_path = str(VIDEO_DIR / request.videoPath.split('/')[-1])

        # Count blinks in the video
        blink_count = count_blinks(video_path)

        # Calculate score: 10 points per blink, capped at 100
        score = min(blink_count * 10, 100)

        return {"score": score, "blinks": blink_count}
    except Exception as e:
        # Return 0 score on error
        return {"score": 0, "blinks": 0, "error": str(e)}


@app.post("/api/check/passive-forensics")
def check_passive_forensics(request: CheckRequest):
    """Passive Forensics: Deepfake detection using artifact heuristics"""
    try:
        from utils.passive_forensics_checker import PassiveForensicsChecker

        # Extract filename and construct full path using VIDEO_DIR
        video_filename = Path(request.videoPath).name
        video_path = VIDEO_DIR / video_filename

        if not video_path.exists():
            print(f"Video not found: {video_path}")
            score = random.randint(0, 100)
            return {"score": score}

        checker = PassiveForensicsChecker()
        score = checker.check_passive_forensics(str(video_path))
        return {"score": int(score)}

    except Exception as e:
        print(f"Error in passive forensics check: {e}")
        score = random.randint(0, 100)
        return {"score": score}


@app.post("/api/check/head-pose")
def check_head_pose(request: CheckRequest):
    """Head Pose: 3D head tracking and pose estimation based on left/right turns"""
    try:
        # Extract video path and construct full path
        video_path = str(VIDEO_DIR / request.videoPath.split('/')[-1])

        # Detect head pose and calculate score
        score = head_pose_detection(video_path)

        return {"score": score}
    except Exception as e:
        # Return 0 score on error
        return {"score": 0, "error": str(e)}


@app.post("/api/check/micro-dynamics")
def check_micro_dynamics(request: CheckRequest):
    """Micro-Dynamics: Natural facial micro-expressions with brightness flash detection"""
    try:
        # Extract video path and construct full path
        video_path = str(VIDEO_DIR / request.videoPath.split('/')[-1])

        # Detect brightness flash on user's face
        score = detect_brightness_flash(video_path)

        return {"score": score}
    except Exception as e:
        # Return 0 score on error
        return {"score": 0, "error": str(e)}


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
