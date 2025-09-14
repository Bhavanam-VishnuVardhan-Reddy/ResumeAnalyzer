import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadTab from './UploadTab';
import HistoryTab from './HistoryTab';
import Details from './Details';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadTab />} />
        <Route path="/history" element={<HistoryTab />} />
        <Route path="/resumes/:id" element={<Details />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
