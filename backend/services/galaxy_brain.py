from typing import List, Dict
import numpy as np
import os
import random
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
import umap
from groq import Groq


class GalaxyRenderer:
    """
    Processes text notes into 3D coordinates with semantic clustering.
    
    Process:
    1. Generate embeddings (384 dimensions)
    2. Run K-means on 384-dim vectors to find semantic topics
    3. Run UMAP to get 3D coordinates (x, y, z)
    4. Apply cluster labels from step 2 to the 3D points from step 3
    5. Generate meaningful category names using LLM
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", n_clusters: int = 5):
        """
        Initialize the GalaxyRenderer.
        
        Args:
            model_name: Sentence transformer model name
            n_clusters: Number of clusters for K-means
        """
        self.model = SentenceTransformer(model_name)
        self.n_clusters = n_clusters
        self.kmeans = None
        self.umap_reducer = None
        # Initialize Groq client if API key is available
        self.groq_client = None
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            try:
                self.groq_client = Groq(api_key=groq_api_key)
                print("Groq client initialized successfully")
            except Exception as e:
                print(f"Error initializing Groq client: {e}")
        else:
            print("WARNING: GROQ_API_KEY not found in environment variables. Category naming will use generic names.")
    
    def _name_clusters(self, cluster_labels: List[int], notes: List[str]) -> Dict[int, str]:
        """
        Generate meaningful category names for clusters using Groq LLM.
        Groups notes by cluster ID and generates a 2-word topic title for each.
        
        Args:
            cluster_labels: List of cluster IDs for each note
            notes: List of text notes
            
        Returns:
            Dictionary mapping cluster ID to category name (e.g., {0: "Astrophysics", 1: "React"})
        """
        if not self.groq_client:
            # Fallback to generic names if Groq is not configured
            unique_clusters = sorted(set(cluster_labels))
            return {cluster_id: f"Category {cluster_id}" for cluster_id in unique_clusters}
        
        cluster_names = {}
        unique_clusters = sorted(set(cluster_labels))
        
        for cluster_id in unique_clusters:
            # Group notes by cluster ID - get all notes belonging to this cluster
            cluster_notes = [notes[i] for i in range(len(notes)) if cluster_labels[i] == cluster_id]
            
            # Select 3 random notes (or all if less than 3)
            sample_size = min(3, len(cluster_notes))
            sample_notes = random.sample(cluster_notes, sample_size) if len(cluster_notes) > sample_size else cluster_notes
            
            # Create prompt asking for a 2-word topic title
            notes_list = "\n".join([f"- {note}" for note in sample_notes])
            prompt = f"Generate a 2-word topic title for these notes:\n{notes_list}\n\nReturn ONLY the 2-word title."
            
            try:
                # Call Groq API with llama-3.1-8b-instant model (llama3-8b-8192 was decommissioned)
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model="llama-3.1-8b-instant",
                    temperature=0.7,
                    max_tokens=20
                )
                
                # Extract the category name (strip whitespace and take first line)
                category_name = chat_completion.choices[0].message.content.strip().split('\n')[0].strip()
                # Ensure exactly 2 words
                words = category_name.split()[:2]
                cluster_names[cluster_id] = " ".join(words) if len(words) == 2 else category_name.split()[0]
            except Exception as e:
                # Fallback to generic name on error
                print(f"Error generating name for cluster {cluster_id}: {e}")
                import traceback
                traceback.print_exc()
                cluster_names[cluster_id] = f"Category {cluster_id}"
        
        return cluster_names
    
    def process_notes(self, notes: List[str]) -> Dict:
        """
        Process a list of text notes into 3D nodes with categories.
        
        Args:
            notes: List of text notes to process
            
        Returns:
            Dictionary with 'nodes' (list of node dicts) and 'cluster_names' (dict mapping category ID to name)
        """
        if not notes:
            return {"nodes": [], "cluster_names": {}}
        
        # Step 1: Generate embeddings (384 dimensions)
        embeddings = self.model.encode(notes, show_progress_bar=False)
        
        # Step 2: Run K-means clustering on 384-dim embeddings to find semantic topics
        self.kmeans = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        cluster_labels_np = self.kmeans.fit_predict(embeddings)
        # Convert numpy array to Python list of native ints to avoid serialization issues
        cluster_labels = [int(label) for label in cluster_labels_np]
        
        # Step 3: Run UMAP to reduce embeddings to 3D coordinates
        # Increased min_dist to spread nodes out more, reduced n_neighbors for more separation
        n_neighbors_val = min(10, len(notes) - 1) if len(notes) > 1 else 1
        self.umap_reducer = umap.UMAP(
            n_components=3,
            n_neighbors=n_neighbors_val,
            min_dist=0.3,  # Increased from 0.1 to spread nodes out more
            random_state=42
        )
        coords_3d = self.umap_reducer.fit_transform(embeddings)
        
        # Step 4: Generate meaningful category names using LLM
        cluster_names = self._name_clusters(cluster_labels, notes)
        
        # Step 5: Apply cluster labels from step 2 to the 3D points from step 3
        # Attach cluster_label to every node object
        nodes = []
        for i, note in enumerate(notes):
            cluster_id = cluster_labels[i]  # Already converted to native int
            nodes.append({
                "id": i,
                "label": note,
                "x": float(coords_3d[i][0]),
                "y": float(coords_3d[i][1]),
                "z": float(coords_3d[i][2]),
                "category": cluster_id,
                "cluster_label": cluster_names.get(cluster_id, f"Category {cluster_id}")
            })
        
        # Ensure cluster_names dictionary keys are native Python ints
        cluster_names_clean = {int(k): str(v) for k, v in cluster_names.items()}
        
        return {
            "nodes": nodes,
            "cluster_names": cluster_names_clean
        }

