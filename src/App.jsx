import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Home() {
  return <h1>NGO Smart Resource Allocation Platform</h1>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
