import React from 'react';
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
import LiveImpactFeed from "./pages/LiveImpactFeed";
import PartnerNGO from "./pages/PartnerNGO";
import ResourceFunding from "./pages/ResourceFunding";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/submit" element={<SubmitReport />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report/:id" element={<ReportDetail />} />
        <Route path="/match/:id" element={<VolunteerMatch />} />
        <Route path="/register" element={<RegisterVolunteer />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/verify-task" element={<VerifyTask />} />
        <Route path="/impact-feed" element={<LiveImpactFeed />} />
        <Route path="/partner" element={<PartnerNGO />} />
        <Route path="/funding" element={<ResourceFunding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
