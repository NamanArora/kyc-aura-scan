"""
Passive Forensics Checker for Video KYC
Detects GAN/compositing artifacts using heuristic-based analysis.

Approach:
- Extracts frames at 3-5 fps
- Detects faces using MediaPipe Face Mesh
- Computes 3 artifact heuristics:
  1. Edge halo (Sobel edges at face boundary vs inner face)
  2. Texture consistency (Laplacian variance across face regions)
  3. Color bleed (face vs neck hue histogram distance)
- Returns score 0-100 (100 = genuine, 0 = deepfake)
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import List, Tuple, Optional
from pathlib import Path


class PassiveForensicsChecker:
    """
    Analyzes video frames for deepfake artifacts using heuristic methods.
    """

    def __init__(self, fps_sample: int = 4):
        """
        Initialize the passive forensics checker.

        Args:
            fps_sample: Frames per second to sample (default 4 FPS)
        """
        self.fps_sample = fps_sample
        self.mp_face_mesh = mp.solutions.face_mesh

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

        if len(frames) < 3:
            raise ValueError(f"Too few frames extracted: {len(frames)}")

        return frames

    def detect_face_region(self, frame: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face region in frame using MediaPipe Face Mesh.

        Args:
            frame: Input frame (BGR format)

        Returns:
            Tuple of (x, y, w, h) for face bounding box, or None if no face detected
        """
        with self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5
        ) as face_mesh:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            if not results.multi_face_landmarks:
                return None

            # Get face landmarks
            face_landmarks = results.multi_face_landmarks[0]
            h, w = frame.shape[:2]

            # Calculate bounding box from landmarks
            x_coords = [int(lm.x * w) for lm in face_landmarks.landmark]
            y_coords = [int(lm.y * h) for lm in face_landmarks.landmark]

            x_min, x_max = min(x_coords), max(x_coords)
            y_min, y_max = min(y_coords), max(y_coords)

            # Add padding (10%)
            padding = 0.1
            face_w = x_max - x_min
            face_h = y_max - y_min
            x_min = max(0, int(x_min - face_w * padding))
            y_min = max(0, int(y_min - face_h * padding))
            x_max = min(w, int(x_max + face_w * padding))
            y_max = min(h, int(y_max + face_h * padding))

            return (x_min, y_min, x_max - x_min, y_max - y_min)

    def compute_edge_halo_score(self, frame: np.ndarray, face_box: Tuple[int, int, int, int]) -> float:
        """
        Compute edge halo score: compares edge intensity at face boundary vs inner face.
        Deepfakes often have sharp edges at face boundaries.

        Args:
            frame: Input frame (BGR)
            face_box: Face bounding box (x, y, w, h)

        Returns:
            Score 0-1 (1 = genuine, 0 = suspicious)
        """
        x, y, w, h = face_box

        # Extract face region
        face = frame[y:y+h, x:x+w]
        if face.size == 0:
            return 0.5

        # Convert to grayscale
        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)

        # Apply Sobel edge detection
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        edges = np.sqrt(sobel_x**2 + sobel_y**2)

        # Define boundary region (outer 10% of face box)
        boundary_thickness = int(min(h, w) * 0.1)
        if boundary_thickness < 2:
            boundary_thickness = 2

        # Create masks for boundary and inner regions
        boundary_mask = np.zeros_like(edges, dtype=bool)
        boundary_mask[:boundary_thickness, :] = True  # Top
        boundary_mask[-boundary_thickness:, :] = True  # Bottom
        boundary_mask[:, :boundary_thickness] = True  # Left
        boundary_mask[:, -boundary_thickness:] = True  # Right

        inner_mask = ~boundary_mask

        # Calculate mean edge intensity
        boundary_edges = edges[boundary_mask].mean() if boundary_mask.any() else 0
        inner_edges = edges[inner_mask].mean() if inner_mask.any() else 0

        # Ratio: boundary edges should be similar to inner edges for genuine faces
        # High ratio (boundary >> inner) is suspicious
        if inner_edges == 0:
            return 0.5

        ratio = boundary_edges / inner_edges
        # Normalize: ratio close to 1.0 is good, higher ratios are suspicious
        score = np.exp(-abs(ratio - 1.0))  # Gaussian-like decay
        return float(np.clip(score, 0, 1))

    def compute_texture_consistency_score(self, frame: np.ndarray, face_box: Tuple[int, int, int, int]) -> float:
        """
        Compute texture consistency score using Laplacian variance across face regions.
        Real faces have consistent texture detail; deepfakes may have uneven detail.

        Args:
            frame: Input frame (BGR)
            face_box: Face bounding box (x, y, w, h)

        Returns:
            Score 0-1 (1 = consistent, 0 = inconsistent)
        """
        x, y, w, h = face_box

        # Extract face region
        face = frame[y:y+h, x:x+w]
        if face.size == 0:
            return 0.5

        # Convert to grayscale
        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)

        # Divide face into 9 regions (3x3 grid)
        regions = []
        for i in range(3):
            for j in range(3):
                region_y = int(i * h / 3)
                region_x = int(j * w / 3)
                region_h = int(h / 3)
                region_w = int(w / 3)
                region = gray[region_y:region_y+region_h, region_x:region_x+region_w]
                if region.size > 0:
                    regions.append(region)

        # Compute Laplacian variance for each region
        variances = []
        for region in regions:
            laplacian = cv2.Laplacian(region, cv2.CV_64F)
            variance = laplacian.var()
            variances.append(variance)

        if len(variances) == 0:
            return 0.5

        variances = np.array(variances)
        # Consistent texture has low variance of variances
        # High variance of variances indicates inconsistent texture
        variance_of_variances = variances.std()
        mean_variance = variances.mean()

        if mean_variance == 0:
            return 0.5

        # Coefficient of variation
        cv = variance_of_variances / mean_variance
        # Lower CV = more consistent = higher score
        score = np.exp(-cv)  # Exponential decay
        return float(np.clip(score, 0, 1))

    def compute_color_bleed_score(self, frame: np.ndarray, face_box: Tuple[int, int, int, int]) -> float:
        """
        Compute color bleed score by comparing face and neck hue histograms.
        Deepfakes may have color inconsistencies between face and neck.

        Args:
            frame: Input frame (BGR)
            face_box: Face bounding box (x, y, w, h)

        Returns:
            Score 0-1 (1 = consistent, 0 = inconsistent)
        """
        x, y, w, h = face_box

        # Extract face region
        face = frame[y:y+h, x:x+w]
        if face.size == 0:
            return 0.5

        # Define face region (upper 70% of box)
        face_region = face[:int(h*0.7), :]

        # Define neck region (below face, if available)
        neck_y_start = y + h
        neck_y_end = min(frame.shape[0], y + int(h * 1.3))
        if neck_y_end <= neck_y_start:
            return 0.8  # No neck visible, assume consistent

        neck_region = frame[neck_y_start:neck_y_end, x:x+w]
        if neck_region.size == 0:
            return 0.8

        # Convert to HSV
        face_hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        neck_hsv = cv2.cvtColor(neck_region, cv2.COLOR_BGR2HSV)

        # Calculate hue histograms
        face_hist = cv2.calcHist([face_hsv], [0], None, [180], [0, 180])
        neck_hist = cv2.calcHist([neck_hsv], [0], None, [180], [0, 180])

        # Normalize histograms
        face_hist = cv2.normalize(face_hist, face_hist).flatten()
        neck_hist = cv2.normalize(neck_hist, neck_hist).flatten()

        # Compare histograms using correlation
        correlation = cv2.compareHist(face_hist, neck_hist, cv2.HISTCMP_CORREL)

        # Correlation ranges from -1 to 1; higher is better
        # Map to 0-1 score
        score = (correlation + 1) / 2
        return float(np.clip(score, 0, 1))

    def analyze_frame(self, frame: np.ndarray) -> Optional[float]:
        """
        Analyze a single frame for deepfake artifacts.

        Args:
            frame: Input frame (BGR)

        Returns:
            Combined score 0-1, or None if no face detected
        """
        # Detect face
        face_box = self.detect_face_region(frame)
        if face_box is None:
            return None

        # Compute individual scores
        edge_score = self.compute_edge_halo_score(frame, face_box)
        texture_score = self.compute_texture_consistency_score(frame, face_box)
        color_score = self.compute_color_bleed_score(frame, face_box)

        # Weighted combination (can be tuned)
        combined_score = (
            0.3 * edge_score +
            0.4 * texture_score +
            0.3 * color_score
        )

        return combined_score

    def check_passive_forensics(self, video_path: str) -> int:
        """
        Main method to check video for deepfake artifacts.

        Args:
            video_path: Path to MP4 video file

        Returns:
            Score from 0-100 (100 = genuine, 0 = deepfake)
        """
        # Extract frames
        frames = self.extract_frames(video_path)

        # Analyze each frame
        scores = []
        for frame in frames:
            score = self.analyze_frame(frame)
            if score is not None:
                scores.append(score)

        if len(scores) == 0:
            raise ValueError("No faces detected in video")

        # Average scores across frames
        avg_score = np.mean(scores)

        # Convert to 0-100 scale
        final_score = int(avg_score * 100)

        # Log results
        print(f"Passive Forensics Analysis:")
        print(f"  Total frames analyzed: {len(frames)}")
        print(f"  Frames with faces: {len(scores)}")
        print(f"  Average score: {avg_score:.3f}")
        print(f"  Final score: {final_score}/100")

        return final_score
