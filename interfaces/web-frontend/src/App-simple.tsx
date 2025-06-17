import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">tomriddelsdell.com</h1>
      <p className="text-gray-600 mt-4">Testing React app rendering...</p>
      <div className="mt-8">
        <a href="/career" className="text-blue-600 hover:underline mr-4">Career</a>
        <a href="/projects" className="text-blue-600 hover:underline mr-4">Projects</a>
        <a href="/tasks" className="text-blue-600 hover:underline mr-4">Tasks</a>
        <a href="/workflows" className="text-blue-600 hover:underline">Workflows</a>
      </div>
    </div>
  );
}

export default App;