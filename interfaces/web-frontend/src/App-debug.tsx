import React from "react";
import { Router, Route, Switch } from "wouter";

// Simple Career component for testing
function SimpleCareer() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Tom Riddelsdell - Career</h1>
      <p className="text-gray-600 mb-4">Professional Journey in Finance and Technology</p>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Experience</h2>
        <p>Financial modeling, automated investment strategies, and full-stack development expertise.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/career" component={SimpleCareer} />
          <Route>
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">tomriddelsdell.com</h1>
              <p>Testing simplified components...</p>
              <a href="/career" className="text-blue-600 hover:underline">Go to Career</a>
            </div>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;