from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from services.galaxy_brain import GalaxyRenderer

# Load environment variables before initializing GalaxyRenderer
load_dotenv()

router = APIRouter()

# Initialize the GalaxyRenderer (after loading .env)
galaxy_renderer = GalaxyRenderer()

# Path to the JSON storage file
DATA_DIR = Path(__file__).parent.parent / "data"
NOTES_FILE = DATA_DIR / "notes.json"


class NotesRequest(BaseModel):
    notes: List[str]


class NoteRequest(BaseModel):
    note: str


def load_notes() -> List[str]:
    """Load notes from JSON file."""
    if not NOTES_FILE.exists():
        return []
    try:
        with open(NOTES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("notes", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading notes: {str(e)}")


def save_notes(notes: List[str]) -> None:
    """Save notes to JSON file."""
    DATA_DIR.mkdir(exist_ok=True)
    try:
        with open(NOTES_FILE, "w", encoding="utf-8") as f:
            json.dump({"notes": notes}, f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving notes: {str(e)}")


@router.post("/process")
async def process_notes(request: NotesRequest) -> Dict:
    """
    Process notes and return nodes with 3D coordinates and categories.
    """
    try:
        result = galaxy_renderer.process_notes(request.notes)
        return {
            "nodes": result["nodes"],
            "cluster_names": result["cluster_names"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing notes: {str(e)}")


@router.get("/nodes")
async def get_nodes() -> Dict:
    """
    Retrieve all processed nodes from storage.
    """
    notes = load_notes()
    if not notes:
        return {"nodes": [], "cluster_names": {}}
    
    try:
        result = galaxy_renderer.process_notes(notes)
        return {
            "nodes": result["nodes"],
            "cluster_names": result["cluster_names"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing nodes: {str(e)}")


@router.post("/notes")
async def add_notes(request: NotesRequest) -> Dict:
    """
    Add new notes to storage, recalculate all positions, and return updated nodes.
    """
    try:
        # Load existing notes
        existing_notes = load_notes()
        
        # Append new notes
        existing_notes.extend(request.notes)
        
        # Save updated notes to storage
        save_notes(existing_notes)
        
        # Re-run galaxy_brain.process_notes() to recalculate all positions (including new ones)
        result = galaxy_renderer.process_notes(existing_notes)
        
        # Return the new list of nodes
        return {
            "message": f"Added {len(request.notes)} note(s)",
            "total_notes": len(existing_notes),
            "nodes": result["nodes"],
            "cluster_names": result["cluster_names"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding notes: {str(e)}")

