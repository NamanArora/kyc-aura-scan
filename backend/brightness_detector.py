import cv2
import mediapipe as mp
import numpy as np


def detect_brightness_flash(video_path: str) -> int:
    """
    Detect red flash reflection in user's eyes after the 9th second.
    Uses MediaPipe Face Mesh to precisely locate eyes and detect red color increase.
    Returns 100 if red eye reflection detected, 0 otherwise.
    """
    # MediaPipe Face Mesh setup for precise eye tracking
    mp_face_mesh = mp.solutions.face_mesh

    # Eye landmark indices for MediaPipe Face Mesh (468 landmarks)
    # Left eye region indices (includes iris and surrounding area)
    LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    # Right eye region indices (includes iris and surrounding area)
    RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]

    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0

    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30  # Default to 30 FPS if can't determine

    # Frame ranges to analyze
    frame_11s = int(11 * fps)  # Frame at 11 seconds

    # Store metrics for each frame
    frame_metrics = []
    frame_count = 0

    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as face_mesh:

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Only process frames we're interested in (before 9s and between 10-11s)
            if frame_count > frame_11s:
                break

            # Convert BGR to RGB for face mesh
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]

                # Extract eye landmarks
                h, w, _ = frame.shape
                landmarks = np.array([(lm.x * w, lm.y * h) for lm in face_landmarks.landmark])

                # Get eye regions
                left_eye_points = landmarks[LEFT_EYE_INDICES].astype(np.int32)
                right_eye_points = landmarks[RIGHT_EYE_INDICES].astype(np.int32)

                # Create masks for both eyes
                left_eye_mask = np.zeros((h, w), dtype=np.uint8)
                right_eye_mask = np.zeros((h, w), dtype=np.uint8)

                cv2.fillConvexPoly(left_eye_mask, cv2.convexHull(left_eye_points), 255)
                cv2.fillConvexPoly(right_eye_mask, cv2.convexHull(right_eye_points), 255)

                # Combine eye masks
                eyes_mask = cv2.bitwise_or(left_eye_mask, right_eye_mask)

                # Extract eye pixels from frame
                eye_pixels = frame[eyes_mask > 0]

                if eye_pixels.size > 0:
                    # Analyze red color intensity in eyes
                    # In OpenCV, BGR format: [B, G, R]
                    avg_blue = np.mean(eye_pixels[:, 0])
                    avg_green = np.mean(eye_pixels[:, 1])
                    avg_red = np.mean(eye_pixels[:, 2])

                    # Calculate red dominance (red channel relative to others)
                    red_dominance = avg_red - ((avg_green + avg_blue) / 2)

                    # Calculate redness ratio (red / (green + blue))
                    redness_ratio = avg_red / (avg_green + avg_blue + 1e-6)

                    # Count pixels with strong red (R > G+B and R > 100)
                    red_pixels = eye_pixels[(eye_pixels[:, 2] > eye_pixels[:, 1] + eye_pixels[:, 0]) &
                                           (eye_pixels[:, 2] > 100)]
                    red_pixel_ratio = len(red_pixels) / len(eye_pixels)

                    timestamp = frame_count / fps
                    frame_metrics.append({
                        'timestamp': timestamp,
                        'avg_red': avg_red,
                        'avg_green': avg_green,
                        'avg_blue': avg_blue,
                        'red_dominance': red_dominance,
                        'redness_ratio': redness_ratio,
                        'red_pixel_ratio': red_pixel_ratio
                    })

    cap.release()

    # Analysis: Check for red flash in eyes
    if len(frame_metrics) < 10:
        return 0  # Not enough data

    # Separate baseline (before 9s) and flash period (10-11s)
    baseline_metrics = [m for m in frame_metrics if m['timestamp'] < 9.0]
    flash_metrics = [m for m in frame_metrics if 10.0 <= m['timestamp'] <= 11.0]

    if not baseline_metrics or not flash_metrics:
        return 0  # Missing data

    # Calculate baseline averages
    baseline_red = np.mean([m['avg_red'] for m in baseline_metrics])
    baseline_dominance = np.mean([m['red_dominance'] for m in baseline_metrics])
    baseline_redness_ratio = np.mean([m['redness_ratio'] for m in baseline_metrics])
    baseline_red_pixels = np.mean([m['red_pixel_ratio'] for m in baseline_metrics])

    # Calculate peak during flash period
    peak_red = np.max([m['avg_red'] for m in flash_metrics])
    peak_dominance = np.max([m['red_dominance'] for m in flash_metrics])
    peak_redness_ratio = np.max([m['redness_ratio'] for m in flash_metrics])
    peak_red_pixels = np.max([m['red_pixel_ratio'] for m in flash_metrics])

    # Calculate changes
    red_increase = ((peak_red - baseline_red) / (baseline_red + 1e-6)) * 100
    dominance_increase = peak_dominance - baseline_dominance
    ratio_increase = ((peak_redness_ratio - baseline_redness_ratio) / (baseline_redness_ratio + 1e-6)) * 100
    red_pixels_increase = ((peak_red_pixels - baseline_red_pixels) / (baseline_red_pixels + 1e-6)) * 100

    # Detection criteria
    flash_detected = False
    score_components = []

    # Criterion 1: Red channel increased significantly (>15%)
    if red_increase > 15:
        score_components.append("red_increase")

    # Criterion 2: Red dominance increased (red stands out from other channels)
    if dominance_increase > 10:
        score_components.append("red_dominance")

    # Criterion 3: Redness ratio increased (>20%)
    if ratio_increase > 20:
        score_components.append("redness_ratio")

    # Criterion 4: More red pixels appeared (>50% increase or significant absolute value)
    if red_pixels_increase > 50 or peak_red_pixels > 0.1:
        score_components.append("red_pixels")

    # Flash detected if at least 2 out of 4 criteria met
    if len(score_components) >= 2:
        flash_detected = True

    print(f"Red Flash Detection in Eyes:")
    print(f"  Red channel increase: {red_increase:.2f}%")
    print(f"  Red dominance increase: {dominance_increase:.2f}")
    print(f"  Redness ratio increase: {ratio_increase:.2f}%")
    print(f"  Red pixels increase: {red_pixels_increase:.2f}% (peak: {peak_red_pixels:.4f})")
    print(f"  Criteria met: {score_components}")
    print(f"  Flash detected: {flash_detected}")

    return 100 if flash_detected else 0
