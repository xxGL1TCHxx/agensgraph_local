function Graph() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Graph Visualization
          </h2>
          <p className="text-gray-600 mb-4">
            Interactive graph visualization will be implemented here using react-force-graph-2d.
          </p>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">
              This will connect to the AgensGraph database via WebSocket and display real-time graph data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Graph