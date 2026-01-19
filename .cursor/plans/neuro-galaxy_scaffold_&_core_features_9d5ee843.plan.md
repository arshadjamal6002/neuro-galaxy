---
name: Neuro-Galaxy Scaffold & Core Features
overview: Scaffold a monorepo with FastAPI backend and React/Vite/R3F frontend. Implement a GalaxyRenderer service that processes text notes into 3D coordinates using sentence transformers and UMAP, and create an interactive 3D visualization component.
todos:
  - id: scaffold-structure
    content: Create monorepo directory structure (/backend, /frontend) with all subdirectories
    status: completed
  - id: backend-requirements
    content: Create backend/requirements.txt with FastAPI, sentence-transformers, umap-learn, scikit-learn, numpy
    status: completed
  - id: galaxy-renderer
    content: "Implement GalaxyRenderer class in backend/services/galaxy_brain.py: generate embeddings (384D), cluster with K-means on embeddings, then reduce to 3D with UMAP and apply cluster labels"
    status: completed
  - id: api-routes
    content: Create FastAPI routes in backend/api/routes.py for processing notes and retrieving nodes
    status: completed
  - id: backend-main
    content: Create backend/main.py with FastAPI app and CORS configuration
    status: completed
  - id: sample-data
    content: Create backend/data/notes.json with sample note structure
    status: completed
  - id: frontend-package
    content: Create frontend/package.json with React, Vite, React Three Fiber dependencies
    status: completed
  - id: vite-config
    content: Create frontend/vite.config.js with API proxy configuration
    status: completed
  - id: galaxy-component
    content: Create frontend/src/components/Galaxy.jsx with R3F scene and sphere rendering
    status: completed
  - id: app-component
    content: Create frontend/src/App.jsx to fetch nodes and render Galaxy component
    status: completed
  - id: frontend-entry
    content: Create frontend/src/main.jsx and index.html entry points
    status: completed
---

# Neuro-Galaxy: 3D Knowledge Visualization Tool

## Architecture Overview

```javascript
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
│   │   └── main.jsx              # Entry point
│   ├── package.json              # Node dependencies
│   └── vite.config.js            # Vite configuration
└── README.md                     # Project documentation
```



## Implementation Details

### Backend (`/backend`)

**File: `services/galaxy_brain.py`**

- `GalaxyRenderer` class with:
- `__init__()`: Initialize sentence transformer model (e.g., `all-MiniLM-L6-v2`)
- `process_notes(notes: List[str]) -> List[Dict]`: 
    - Generate embeddings using sentence_transformers (384 dimensions)
    - Run K-means clustering on 384-dim embeddings to find semantic topics (5 clusters by default)
    - Run UMAP to reduce embeddings to 3D coordinates (n_components=3, n_neighbors=15, min_dist=0.1)
    - Apply cluster labels from step 2 to the 3D points from step 3
    - Return nodes with `{id, label, x, y, z, category}` structure

**File: `api/routes.py`**

- `POST /api/process`: Accept JSON `{notes: List[str]}` and return processed nodes
- `GET /api/nodes`: Retrieve all processed nodes from JSON storage
- `POST /api/notes`: Add new notes to storage

**File: `main.py`**

- FastAPI app with CORS enabled for frontend
- Mount routes from `api/routes.py`
- Serve on `http://localhost:8000`

**File: `requirements.txt`**

- `fastapi`, `uvicorn[standard]`
- `sentence-transformers`
- `umap-learn`
- `scikit-learn` (for K-means clustering)
- `numpy`
- `pydantic`

**File: `data/notes.json`**

- Initial sample data structure: `{"notes": ["sample note 1", "sample note 2", ...]}`

### Frontend (`/frontend`)

**File: `src/components/Galaxy.jsx`**

- React Three Fiber scene with:
- `<Canvas>` wrapper with camera controls
- Map nodes array to `<Sphere>` meshes positioned at (x, y, z)
- Color nodes by category
- Add `<Text>` labels above/below spheres
- Interactive features:
    - Click handlers on spheres (console.log or highlight)
    - OrbitControls for camera rotation
    - Basic lighting (`<ambientLight>` and `<pointLight>`)

**File: `src/App.jsx`**

- Fetch nodes from backend API (`GET /api/nodes`)
- Pass nodes to `<Galaxy>` component
- Add loading state and error handling
- Optional: Search/filter UI for nodes

**File: `package.json`**

- Dependencies: `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `three`, `vite`

**File: `vite.config.js`**

- Configure proxy to backend API (`/api` -> `http://localhost:8000/api`)

## Data Flow

```javascript
User Notes → FastAPI → GalaxyRenderer → Embeddings (384D) → K-means Categories
                                                          ↓
                                                      UMAP 3D (x,y,z)
                                                          ↓
                                                    Apply Categories → JSON Storage
                                                                    ↓
Frontend ← React Three Fiber ← API Fetch ← JSON Storage
```



## Design Decisions

1. **Categories**: Automatically derived using K-means clustering on high-dimensional embeddings (384D) before UMAP reduction, preserving semantic meaning. Categories are then applied to the 3D coordinates.
2. **API**: Simple REST endpoints with JSON storage (simulating DB)
3. **3D Visualization**: Spheres with category-based colors, interactive controls
4. **Embeddings**: Using `all-MiniLM-L6-v2` model (lightweight, fast)

## Future Enhancements (Not in Initial Plan)

- Node connections/edges based on similarity