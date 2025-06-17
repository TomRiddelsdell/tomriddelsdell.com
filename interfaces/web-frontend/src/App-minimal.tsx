import React from "react";
import { Router, Route, Switch } from "wouter";
import Career from "./pages/Career-fixed";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/career" component={Career} />
          <Route>
            <div className="p-8">
              <h1 className="text-2xl font-bold">FlowCreate Platform</h1>
              <p className="text-gray-600">Simple test version</p>
              <a href="/career" className="text-blue-600">Go to Career</a>
            </div>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;