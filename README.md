# Travel Assistant - LLM Chat Interface

A simple chat interface for travel planning powered by DSPy and React.

## Setup

### Backend (Python/Flask)

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5000`

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
