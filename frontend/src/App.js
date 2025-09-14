
import React from 'react';
import styles from './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import UploadTab from './UploadTab';
import HistoryTab from './HistoryTab';
import Details from './Details';

function App() {
  return (
    <BrowserRouter>
      <div className={styles.appHeader}>Resume Analyzer</div>
      <div className={styles.tabButtons}>
        <Link to="/">
          <input type="button" value="Upload" />
        </Link>
        <Link to="/history">
          <input type="button" value="History" />
        </Link>
      </div>
      <Routes>
        <Route path="/" element={<UploadTab />} />
        <Route path="/history" element={<HistoryTab />} />
        <Route path="/resumes/:id" element={<Details />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
