function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#2563eb' }}>Hello World Test Frontend</h1>
      <p>This is a minimal React test frontend to verify configuration.</p>
      <div style={{ 
        margin: '20px 0',
        padding: '10px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <p>✅ React is working</p>
        <p>✅ TypeScript is compiling</p>
        <p>✅ Vite is serving the frontend</p>
      </div>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}

export default App