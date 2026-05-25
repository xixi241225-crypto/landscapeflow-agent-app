import { Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Workbench from './components/Workbench';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/workbench" element={<Workbench />} />
      </Routes>
    </div>
  );
}
