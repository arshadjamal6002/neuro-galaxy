# Neuro-Galaxy

A 3D knowledge visualization tool that transforms text notes into an interactive 3D galaxy using semantic embeddings and dimensionality reduction.

## Tech Stack

- **Backend**: Python (FastAPI)
- **Frontend**: React (Vite) + React Three Fiber
- **Data**: Local JSON storage

## Architecture

The system processes text notes through the following pipeline:

1. **Generate Embeddings** (384 dimensions) using sentence transformers
2. **K-means Clustering** on high-dimensional embeddings to find semantic topics
3. **UMAP Reduction** to 3D coordinates (x, y, z)
4. **Apply Categories** from clustering to 3D points

This approach preserves semantic meaning by clustering in high-dimensional space before reducing to 3D.

## Project Structure

```
neuro-galaxy/
├── backend/
│   ├── services/
│   │   └── galaxy_brain.py      # GalaxyRenderer class
│   ├── api/
│   │   └── routes.py             # FastAPI endpoints
│   ├── data/
│   │   └── notes.json            # Local JSON storage
│   ├── main.py                   # FastAPI app entry point
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Galaxy.jsx        # R3F 3D visualization
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json              # Node dependencies
│   └── vite.config.js            # Vite configuration
└── README.md                     # This file
```

## Setup

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `GET /api/nodes` - Retrieve all processed nodes with 3D coordinates
- `POST /api/process` - Process a list of notes and return nodes
  - Body: `{"notes": ["note 1", "note 2", ...]}`
- `POST /api/notes` - Add new notes to storage
  - Body: `{"notes": ["note 1", "note 2", ...]}`

## Features

- **3D Visualization**: Interactive 3D galaxy of knowledge nodes
- **Semantic Clustering**: Automatic categorization based on semantic similarity
- **Interactive Controls**: Click nodes, rotate camera, search and filter
- **Real-time Updates**: Add new notes and see them appear in the galaxy

## Future Enhancements

- Node connections/edges based on similarity
- Animation/interpolation when new notes are added
- Advanced search and filter UI
- Export/import functionality
- Category legend/controls


