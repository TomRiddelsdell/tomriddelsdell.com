import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Workflows() {
  const { user } = useAuth();

  const workflows = [
    {
      id: 1,
      name: "Data Processing Pipeline",
      status: "running",
      lastRun: "2 minutes ago",
      description: "Automated data validation and transformation"
    },
    {
      id: 2,
      name: "Email Marketing Campaign",
      status: "paused",
      lastRun: "1 hour ago",
      description: "Scheduled email sequences for customer engagement"
    },
    {
      id: 3,
      name: "Inventory Management",
      status: "running",
      lastRun: "15 minutes ago",
      description: "Stock level monitoring and reorder automation"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="text-gray-600 mt-2">Manage your automated processes</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create New Workflow
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-semibold text-gray-900">{workflow.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.status === "running"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{workflow.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Last run: {workflow.lastRun}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    Edit
                  </button>
                  <button
                    className={`px-3 py-1 rounded transition-colors ${
                      workflow.status === "running"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {workflow.status === "running" ? "Pause" : "Start"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-blue-600 font-semibold">Data Integration</div>
              <div className="text-sm text-gray-600 mt-1">Connect and sync data sources</div>
            </div>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-blue-600 font-semibold">Notification System</div>
              <div className="text-sm text-gray-600 mt-1">Automated alerts and messages</div>
            </div>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-blue-600 font-semibold">Report Generation</div>
              <div className="text-sm text-gray-600 mt-1">Scheduled data reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}