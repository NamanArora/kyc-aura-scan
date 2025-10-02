import cv2
import mediapipe as mp
import numpy as np


def calculate_ear(eye_landmarks):
    """
    Calculate Eye Aspect Ratio (EAR) for blink detection.
    EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    """
    # Vertical eye landmarks
    A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    # Horizontal eye landmark
    C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])

    ear = (A + B) / (2.0 * C)
    return ear


def count_blinks(video_path: str) -> int:
    """
    Count the number of blinks in a video using MediaPipe Face Mesh.
    Returns the total number of blinks detected.
    """
    # MediaPipe Face Mesh setup
    mp_face_mesh = mp.solutions.face_mesh

    # Eye landmark indices for MediaPipe Face Mesh (468 landmarks)
    # Left eye indices: [33, 160, 158, 133, 153, 144]
    # Right eye indices: [362, 385, 387, 263, 373, 380]
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

    # Blink detection parameters
    EAR_THRESHOLD = 0.21  # Eye Aspect Ratio threshold for blink
    CONSECUTIVE_FRAMES = 2  # Minimum consecutive frames below threshold

    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0

    blink_count = 0
    frame_counter = 0
    blink_in_progress = False

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

            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]

                # Extract eye landmarks
                h, w = frame.shape[:2]
                landmarks = np.array([(lm.x * w, lm.y * h) for lm in face_landmarks.landmark])

                left_eye = landmarks[LEFT_EYE_INDICES]
                right_eye = landmarks[RIGHT_EYE_INDICES]

                # Calculate EAR for both eyes
                left_ear = calculate_ear(left_eye)
                right_ear = calculate_ear(right_eye)
                avg_ear = (left_ear + right_ear) / 2.0

                # Detect blink
                if avg_ear < EAR_THRESHOLD:
                    frame_counter += 1
                else:
                    if frame_counter >= CONSECUTIVE_FRAMES:
                        if not blink_in_progress:
                            blink_count += 1
                            blink_in_progress = True
                    frame_counter = 0
                    blink_in_progress = False

    cap.release()
    return blink_count
