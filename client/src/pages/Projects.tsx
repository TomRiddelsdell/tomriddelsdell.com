import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { user } = useAuth();

  const projects = [
    {
      id: 1,
      name: "Customer Data Migration",
      status: "in-progress",
      progress: 75,
      deadline: "2025-06-20",
      description: "Migrating legacy customer data to new CRM system"
    },
    {
      id: 2,
      name: "API Integration Hub",
      status: "completed",
      progress: 100,
      deadline: "2025-06-15",
      description: "Centralized API gateway for third-party integrations"
    },
    {
      id: 3,
      name: "Automated Reporting System",
      status: "planning",
      progress: 25,
      deadline: "2025-07-01",
      description: "Real-time analytics and reporting dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">Track your automation projects and deliverables</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      project.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : project.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {project.status.replace("-", " ")}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{project.progress}%</div>
                  <div className="text-sm text-gray-500">complete</div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{project.description}</p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                  View Details
                </button>
                <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Project Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-blue-600 font-semibold">Data Pipeline</div>
              <div className="text-sm text-gray-600 mt-1">ETL automation project</div>
            </div>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-blue-600 font-semibold">System Integration</div>
              <div className="text-sm text-gray-600 mt-1">Connect multiple systems</div>
            </div>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-blue-600 font-semibold">Process Automation</div>
              <div className="text-sm text-gray-600 mt-1">Streamline business workflows</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}