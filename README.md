# Travel Assistant - LLM Chat Interface

A simple chat interface for travel planning powered by DSPy and React.

## Setup

### Backend (Python/Flask)

**Requirements:** Python 3.8+ (no conda required - works with standard Python/pip)

1. (Optional but recommended) Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your API key:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Google Gemini API key:
     ```
     GOOGLE_API_KEY=your-actual-api-key-here
     ```
   - Or export it directly:
     ```bash
     export GOOGLE_API_KEY="your-actual-api-key-here"
     ```
   - Get your API key from: https://makersuite.google.com/app/apikey

4. Run the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5001` (port 5000 is used by macOS AirPlay)

### Frontend (React)

1. Install Node dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173` (or another port if 5173 is in use)

## Architecture

- **Frontend**: React chat interface (`src/ChatInterface.jsx`)
- **Backend**: Flask API server (`app.py`)
- **DSPy Module**: RAG system (`dspy_module.py`)

The chat interface sends user messages to the Flask API, which processes them through the DSPy RAG system and returns responses.

## Files

- `src/ChatInterface.jsx` - Main chat component
- `app.py` - Flask API server
- `dspy_module.py` - DSPy RAG module (refactored from dspy_rag.py)
- `requirements.txt` - Python dependencies
