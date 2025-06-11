export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to FlowCreate
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Professional workflow automation platform with advanced analytics and monitoring.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Analytics Dashboard</h3>
            <p className="text-gray-600">Real-time system monitoring and performance metrics.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Workflow Management</h3>
            <p className="text-gray-600">Create and manage automated workflows efficiently.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">System Health</h3>
            <p className="text-gray-600">Monitor system status and performance indicators.</p>
          </div>
        </div>
      </div>
    </div>
  );
}