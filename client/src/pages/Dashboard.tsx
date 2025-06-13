import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.displayName || user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Workflows</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
            <p className="text-sm text-gray-500 mt-1">Running processes</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Completed Tasks</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">847</p>
            <p className="text-sm text-gray-500 mt-1">This month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Connected Apps</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">8</p>
            <p className="text-sm text-gray-500 mt-1">Integrations active</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Time Saved</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">42h</p>
            <p className="text-sm text-gray-500 mt-1">This week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Data processing workflow completed</span>
                <span className="text-sm text-gray-500">2 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">New integration with Slack activated</span>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">Workflow template updated</span>
                <span className="text-sm text-gray-500">3 hours ago</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <div className="text-blue-600 font-semibold">Create Workflow</div>
                <div className="text-sm text-gray-600">Start a new automation</div>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <div className="text-green-600 font-semibold">View Analytics</div>
                <div className="text-sm text-gray-600">Performance insights</div>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <div className="text-purple-600 font-semibold">Manage Apps</div>
                <div className="text-sm text-gray-600">Connected services</div>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
                <div className="text-orange-600 font-semibold">Settings</div>
                <div className="text-sm text-gray-600">Account preferences</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}