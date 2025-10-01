# FastAPI Backend

Minimal FastAPI backend with a single endpoint.

## Quick Start (Docker - Recommended)

**Prerequisites:** Docker and Docker Compose installed

1. Start the server:
```bash
cd backend
docker-compose up
```

2. Server will be running at `http://localhost:8000`

3. Uploaded videos are saved to `backend/public/video/` and persist on your filesystem

**Benefits:**
- No Python/pyenv installation required
- Automatic hot-reload on code changes
- Video uploads saved to `public/video/` sync bidirectionally with container
- Consistent environment across all machines

To stop: `docker-compose down`

---

## Manual Setup (Alternative)

1. Create Python 3.8 virtual environment:
```bash
cd backend
~/.pyenv/versions/3.8.18/bin/python -m venv venv
```

Note: Python 3.8.18 was installed via pyenv. If you don't have it:
```bash
brew install pyenv
pyenv install 3.8.18
```

2. Activate virtual environment:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Run

**IMPORTANT:** You must activate the venv first, otherwise uvicorn will use system Python 3.13 instead of 3.8!

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

Alternative (run without activating):
```bash
cd backend
venv/bin/uvicorn main:app --reload
```

The server will run on `http://localhost:8000`

## API Endpoints

- `GET /hello` - Returns `{"message": "hello world"}`

Example:
```bash
curl http://localhost:8000/hello
```

## Video Storage

Videos uploaded from the frontend are saved to `backend/public/video/`.

**Docker:** Files saved in the container automatically appear in your local filesystem at `backend/public/video/`

**Manual:** Files are saved directly to the local `backend/public/video/` folder
