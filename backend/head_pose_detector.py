import cv2
import mediapipe as mp
import numpy as np


def calculate_head_yaw(face_landmarks, frame_width, frame_height):
    """
    Calculate head yaw angle (left-right rotation) from facial landmarks.
    Returns yaw angle in degrees. Positive = right turn, Negative = left turn.
    """
    # Key landmarks for yaw calculation
    # Nose tip: 1
    # Left face edge: 234
    # Right face edge: 454
    nose_tip = np.array([
        face_landmarks.landmark[1].x * frame_width,
        face_landmarks.landmark[1].y * frame_height
    ])

    left_face = np.array([
        face_landmarks.landmark[234].x * frame_width,
        face_landmarks.landmark[234].y * frame_height
    ])

    right_face = np.array([
        face_landmarks.landmark[454].x * frame_width,
        face_landmarks.landmark[454].y * frame_height
    ])

    # Calculate distances from nose to left and right face edges
    dist_left = np.linalg.norm(nose_tip - left_face)
    dist_right = np.linalg.norm(nose_tip - right_face)

    # Calculate yaw ratio and convert to approximate angle
    ratio = (dist_left - dist_right) / (dist_left + dist_right + 1e-6)

    # Convert ratio to approximate degrees (-60 to +60)
    yaw_angle = ratio * 60

    return yaw_angle


def check_ear_visibility(face_landmarks, frame_width, frame_height):
    """
    Check if left and/or right ear is visible based on landmark depth.
    Returns (left_ear_visible, right_ear_visible) as booleans.
    """
    # Ear landmark indices in MediaPipe Face Mesh
    LEFT_EAR_INDICES = [234, 127, 162]
    RIGHT_EAR_INDICES = [454, 356, 389]

    left_ear_visible = False
    right_ear_visible = False

    # Calculate average depth (z) for ear regions
    left_ear_z = np.mean([face_landmarks.landmark[i].z for i in LEFT_EAR_INDICES])
    right_ear_z = np.mean([face_landmarks.landmark[i].z for i in RIGHT_EAR_INDICES])

    # Calculate face center depth for comparison
    nose_z = face_landmarks.landmark[1].z

    # If ear landmarks are significantly closer (more visible), mark as visible
    left_ear_visible = left_ear_z < nose_z - 0.01
    right_ear_visible = right_ear_z < nose_z - 0.01

    return left_ear_visible, right_ear_visible


def head_pose_detection(video_path: str) -> int:
    """
    Detect head pose movements (left and right turns) in a video.
    Returns a score from 0-100 based on:
    - 100: Both ears fully visible at some point
    - 70-90: Full left and right side visible (good rotation both ways, even without both ears)
    - Less than 50: Sides aren't fully or properly visible
    """
    # MediaPipe Face Mesh setup
    mp_face_mesh = mp.solutions.face_mesh

    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0

    # Tracking variables
    max_left_yaw = 0  # Most negative (left turn)
    max_right_yaw = 0  # Most positive (right turn)
    left_ear_detected = False
    right_ear_detected = False

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
                h, w = frame.shape[:2]

                # Calculate yaw angle
                yaw = calculate_head_yaw(face_landmarks, w, h)

                # Track maximum rotations
                if yaw < max_left_yaw:
                    max_left_yaw = yaw
                if yaw > max_right_yaw:
                    max_right_yaw = yaw

                # Check ear visibility
                left_ear_vis, right_ear_vis = check_ear_visibility(face_landmarks, w, h)

                if left_ear_vis:
                    left_ear_detected = True
                if right_ear_vis:
                    right_ear_detected = True

    cap.release()

    # Calculate score based on rotation and ear visibility
    score = 0

    # Get absolute rotation amounts
    left_rotation = abs(max_left_yaw)
    right_rotation = abs(max_right_yaw)

    # Both ears detected = 100 points
    if left_ear_detected and right_ear_detected:
        score = 100
    # One ear detected with good rotation = 80-90
    elif left_ear_detected or right_ear_detected:
        # Good rotation on both sides
        if left_rotation >= 30 and right_rotation >= 30:
            score = 90
        elif left_rotation >= 25 and right_rotation >= 25:
            score = 85
        elif left_rotation >= 20 and right_rotation >= 20:
            score = 80
        else:
            # Not enough rotation even with ear visible
            score = 40
    # No ears detected - check if full sides shown via rotation
    else:
        # Full left and right side visible (strong rotation both ways) = 70-80
        if left_rotation >= 35 and right_rotation >= 35:
            score = 80
        elif left_rotation >= 30 and right_rotation >= 30:
            score = 75
        elif left_rotation >= 25 and right_rotation >= 25:
            score = 70
        # Not fully visible = less than 50
        else:
            # Partial rotation gets lower scores
            avg_rotation = (left_rotation + right_rotation) / 2
            if avg_rotation >= 20:
                score = 45
            elif avg_rotation >= 15:
                score = 35
            elif avg_rotation >= 10:
                score = 25
            else:
                score = max(0, int(avg_rotation * 2))

    return score
