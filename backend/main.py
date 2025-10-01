from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
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
