import { Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Workbench from './components/Workbench';
import RoadshowMode from './components/roadshow/RoadshowMode';

export default function App() {
  return (
    <div className="app-shell min-h-screen">
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/roadshow" element={<RoadshowMode />} />
      </Routes>
    </div>
  );
}
