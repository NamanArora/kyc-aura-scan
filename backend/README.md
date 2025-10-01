# FastAPI Backend

Minimal FastAPI backend with a single endpoint.

## Setup

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

## API Endpoint

- `GET /hello` - Returns `{"message": "hello world"}`

Example:
```bash
curl http://localhost:8000/hello
```
