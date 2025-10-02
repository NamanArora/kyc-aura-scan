"""
Temporal Integrity Checker for Video KYC
Detects loops, replays, and frozen feeds using perceptual hashing.

Approach:
- Computes perceptual hash (phash) for each frame
- Tracks Hamming distances between consecutive frames
- Detects frozen frames, duplicate frames, and loop patterns
- Returns score 0-100 (100 = genuine live stream, 0 = clear attack)
"""

import cv2
import numpy as np
from PIL import Image
import imagehash
from scipy import signal
from typing import List, Tuple
from pathlib import Path


class TemporalIntegrityChecker:
    """
    Analyzes video temporal integrity to detect loops, replays, and frozen feeds.
    """

    def __init__(self, fps_sample: int = 5, frozen_threshold: int = 7, loop_window_sec: Tuple[float, float] = (8, 12)):
        """
        Initialize the temporal integrity checker.

        Args:
            fps_sample: Frames per second to sample (default 5 FPS for efficiency)
            frozen_threshold: Hamming distance threshold for frozen frames (default 7)
            loop_window_sec: Time window in seconds to detect loop patterns (default 8-12s)
        """
        self.fps_sample = fps_sample
        self.frozen_threshold = frozen_threshold
        self.loop_window_sec = loop_window_sec

    def extract_frames(self, video_path: str) -> List[np.ndarray]:
        """
        Extract frames from video at specified FPS.

        Args:
            video_path: Path to video file

        Returns:
            List of frames as numpy arrays
        """
        if not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            fps = 30  # Default fallback

        frame_interval = max(1, int(fps / self.fps_sample))
        frames = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                frames.append(frame)

            frame_idx += 1

        cap.release()

        if len(frames) < 10:
            raise ValueError(f"Too few frames extracted: {len(frames)}")

        return frames

    def compute_perceptual_hashes(self, frames: List[np.ndarray]) -> List[imagehash.ImageHash]:
        """
        Compute perceptual hash (phash) for each frame.

        Args:
            frames: List of frames as numpy arrays

        Returns:
            List of perceptual hashes
        """
        hashes = []
        for frame in frames:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame)
            phash = imagehash.phash(pil_image, hash_size=8)
            hashes.append(phash)

        return hashes

    def compute_hamming_distances(self, hashes: List[imagehash.ImageHash]) -> np.ndarray:
        """
        Compute Hamming distances between consecutive frame hashes.

        Args:
            hashes: List of perceptual hashes

        Returns:
            Array of Hamming distances
        """
        distances = []
        for i in range(len(hashes) - 1):
            distance = hashes[i] - hashes[i + 1]
            distances.append(distance)

        return np.array(distances)

    def detect_frozen_frames(self, distances: np.ndarray) -> Tuple[int, float]:
        """
        Detect frozen or near-frozen frames based on low Hamming distances.

        Args:
            distances: Array of Hamming distances

        Returns:
            Tuple of (frozen_count, frozen_duration_seconds)
        """
        frozen_mask = distances < self.frozen_threshold
        frozen_count = np.sum(frozen_mask)
        frozen_duration = frozen_count / self.fps_sample  # Convert to seconds

        return int(frozen_count), float(frozen_duration)

    def detect_duplicate_frames(self, distances: np.ndarray) -> Tuple[int, float]:
        """
        Detect exact duplicate frames (Hamming distance = 0).

        Args:
            distances: Array of Hamming distances

        Returns:
            Tuple of (duplicate_count, duplicate_percentage)
        """
        duplicate_count = np.sum(distances == 0)
        duplicate_percentage = (duplicate_count / len(distances)) * 100

        return int(duplicate_count), float(duplicate_percentage)

    def detect_loop_pattern(self, distances: np.ndarray) -> bool:
        """
        Detect loop patterns using autocorrelation on Hamming distance series.

        Args:
            distances: Array of Hamming distances

        Returns:
            True if loop pattern detected, False otherwise
        """
        if len(distances) < 40:  # Need at least 8 seconds at 5 FPS
            return False

        # Compute autocorrelation
        autocorr = signal.correlate(distances, distances, mode='full')
        autocorr = autocorr[len(autocorr) // 2:]  # Take second half (positive lags)

        # Normalize
        autocorr = autocorr / autocorr[0] if autocorr[0] != 0 else autocorr

        # Look for peaks in 8-12 second window (40-60 frames at 5 FPS)
        loop_min_lag = int(self.loop_window_sec[0] * self.fps_sample)
        loop_max_lag = int(self.loop_window_sec[1] * self.fps_sample)

        if loop_max_lag >= len(autocorr):
            loop_max_lag = len(autocorr) - 1

        if loop_min_lag >= loop_max_lag:
            return False

        # Find peaks in the window
        window_autocorr = autocorr[loop_min_lag:loop_max_lag]
        peak_threshold = 0.5  # Strong correlation threshold

        return bool(np.any(window_autocorr > peak_threshold))

    def calculate_score(self, frozen_duration: float, duplicate_percentage: float, loop_detected: bool, total_duration: float) -> int:
        """
        Calculate temporal integrity score based on detected anomalies.

        Args:
            frozen_duration: Duration of frozen content in seconds
            duplicate_percentage: Percentage of duplicate frames
            loop_detected: Whether a loop pattern was detected
            total_duration: Total video duration in seconds

        Returns:
            Score from 0-100 (100 = genuine, 0 = clear attack)
        """
        score = 100

        # Calculate frozen percentage
        frozen_percentage = (frozen_duration / total_duration * 100) if total_duration > 0 else 0

        # Only penalize frozen frames if >50% of video is frozen (tolerance for still subjects)
        if frozen_percentage > 50:
            # Deduct for frozen frames: -3 points per second of frozen content (reduced from -10)
            frozen_penalty = int(frozen_duration * 3)
            score -= frozen_penalty

        # Only penalize duplicates if >60% of frames are duplicates (tolerance for compression)
        if duplicate_percentage > 60:
            # Deduct for duplicate frames: -1 point per 10% duplicates (reduced from -5)
            duplicate_penalty = int((duplicate_percentage / 10) * 1)
            score -= duplicate_penalty

        # Deduct for loop detection: -30 points (unchanged - strong indicator of attack)
        if loop_detected:
            score -= 30

        # Ensure score is in valid range
        score = max(0, min(100, score))

        return score

    def check_temporal_integrity(self, video_path: str) -> int:
        """
        Main method to check temporal integrity of a video.

        Args:
            video_path: Path to MP4 video file

        Returns:
            Score from 0-100 (100 = genuine live stream, 0 = clear attack)
        """
        # Extract frames
        frames = self.extract_frames(video_path)
        total_duration = len(frames) / self.fps_sample

        # Compute perceptual hashes
        hashes = self.compute_perceptual_hashes(frames)

        # Compute Hamming distances
        distances = self.compute_hamming_distances(hashes)

        # Detect anomalies
        frozen_count, frozen_duration = self.detect_frozen_frames(distances)
        duplicate_count, duplicate_percentage = self.detect_duplicate_frames(distances)
        loop_detected = self.detect_loop_pattern(distances)

        # Calculate final score
        score = self.calculate_score(frozen_duration, duplicate_percentage, loop_detected, total_duration)

        # Log detection results
        print(f"Temporal Integrity Analysis:")
        print(f"  Total frames: {len(frames)}")
        print(f"  Duration: {total_duration:.2f}s")
        print(f"  Frozen frames: {frozen_count} ({frozen_duration:.2f}s)")
        print(f"  Duplicate frames: {duplicate_count} ({duplicate_percentage:.1f}%)")
        print(f"  Loop detected: {loop_detected}")
        print(f"  Final score: {score}/100")

        return score
