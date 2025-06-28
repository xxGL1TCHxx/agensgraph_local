function Home() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to AgensGraph
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            A modern graph database visualization platform built with React and AgensGraph.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Graph Visualization</h3>
              <p className="text-gray-600">
                Interactive graph visualization with zoom, pan, and node exploration.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Live data updates via WebSocket connections for dynamic graph changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home