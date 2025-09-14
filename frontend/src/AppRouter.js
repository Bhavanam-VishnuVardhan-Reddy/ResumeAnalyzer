import { Routes, Route } from 'react-router-dom';
import UploadTab from "./UploadTab";
import HistoryTab from "./HistoryTab";
import Details from "./Details";

const activeTab = { UPLOAD: 'Upload', HISTORY: 'History' };

function AppRouter({ active }) {
  return (
    <Routes>
      <Route path="/" element={active === activeTab.UPLOAD ? <UploadTab /> : <HistoryTab />} />
      <Route path="/resumes/:id" element={<Details />} />
    </Routes>
  );
}

export default AppRouter;
