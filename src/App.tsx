import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./pages/MapPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/google-map" element={<MapPage />} />
      </Routes>
    </Router>
  );
}

export default App;
