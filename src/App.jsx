import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';

import RoleSelector from "./pages/RoleSelector";
import SubmitReport from "./pages/SubmitReport";
import Dashboard from "./pages/Dashboard";
import ReportDetail from "./pages/ReportDetail";
import VolunteerMatch from "./pages/VolunteerMatch";
import RegisterVolunteer from "./pages/RegisterVolunteer";
import MyTasks from "./pages/MyTasks";
import VerifyTask from "./pages/VerifyTask";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/submit" element={<SubmitReport />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report/:id" element={<ReportDetail />} />
        <Route path="/match/:id" element={<VolunteerMatch />} />
        <Route path="/register" element={<RegisterVolunteer />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/verify-task" element={<VerifyTask />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
