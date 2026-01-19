import { useState, useEffect } from 'react'
import Galaxy from './components/Galaxy'
import './App.css'

function App() {
  const [nodes, setNodes] = useState([])
  const [clusterNames, setClusterNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  useEffect(() => {
    fetchNodes()
  }, [])

  const fetchNodes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/nodes')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Fetched nodes:', data.nodes?.[0]) // Debug: check first node structure
      setNodes(data.nodes || [])
      setClusterNames(data.cluster_names || {})
    } catch (err) {
      setError(err.message)
      console.error('Error fetching nodes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node)
    console.log('Selected node:', node)
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || isAddingNote) return

    try {
      setIsAddingNote(true)
      setError(null)
      
      const response = await fetch('http://localhost:8000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: [newNote.trim()] }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Update nodes with the new list returned from the server
      if (data.nodes) {
        setNodes(data.nodes)
        setClusterNames(data.cluster_names || {})
      } else {
        // Fallback: fetch nodes again if not returned
        await fetchNodes()
      }
      
      setNewNote('')
    } catch (err) {
      setError(err.message)
      console.error('Error adding note:', err)
    } finally {
      setIsAddingNote(false)
    }
  }

  const filteredNodes = nodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading galaxy...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchNodes}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Neuro-Galaxy</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="stats">
          <p>Total Nodes: {nodes.length}</p>
          <p>Filtered: {filteredNodes.length}</p>
        </div>
        {selectedNode && (
          <div className="node-details">
            <h3>Selected Node</h3>
            <p><strong>Label:</strong> {selectedNode.label}</p>
            <p><strong>Category:</strong> {selectedNode.cluster_label || `Category ${selectedNode.category}`}</p>
            <p><strong>Position:</strong> ({selectedNode.x.toFixed(2)}, {selectedNode.y.toFixed(2)}, {selectedNode.z.toFixed(2)})</p>
          </div>
        )}
        <div className="legend">
          <h3>Categories</h3>
          {Array.from(new Set(nodes.map(n => {
            // Use cluster_label if it exists, otherwise fallback to cluster_names mapping, then generic
            return n.cluster_label || clusterNames[n.category] || `Category ${n.category}`
          }))).sort().map((label, index) => {
            // Find the category ID for this label to get the color
            const nodeWithLabel = nodes.find(n => {
              const nodeLabel = n.cluster_label || clusterNames[n.category] || `Category ${n.category}`
              return nodeLabel === label
            })
            const catId = nodeWithLabel ? nodeWithLabel.category : index
            return (
              <div key={label} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ 
                    backgroundColor: `#${['FF3366', '00FFFF', '3366FF', 'FF66FF', '66FF66', 'FFFF00', 'FF9900', '9966FF'][catId % 8]}`
                  }}
                />
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="galaxy-view">
        <Galaxy nodes={filteredNodes} onNodeClick={handleNodeClick} />
      </div>
      
      {/* Brain Dump Input Bar */}
      <form className="brain-dump-input" onSubmit={handleAddNote}>
        <input
          type="text"
          placeholder="Add a new thought to the galaxy..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={isAddingNote}
          className="brain-dump-input-field"
        />
        <button
          type="submit"
          disabled={!newNote.trim() || isAddingNote}
          className="brain-dump-submit"
        >
          {isAddingNote ? '...' : '→'}
        </button>
      </form>
    </div>
  )
}

export default App

