import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  useEffect(() => {
    const seedData = async () => {
      if (!localStorage.getItem('demoSeeded')) {
        try {
          console.log("Seeding demo data...");
          await addDoc(collection(db, 'tasks'), {
            issueType: 'medical', reportLocation: 'Northside Clinic', volunteerName: 'Dr. Sarah Jenkins',
            status: 'completed', urgencyLevel: 'Critical', affectedCount: 45, hoursToComplete: 1.5,
            impactStatement: 'On today, volunteer Dr. Sarah Jenkins provided emergency medical triage at Northside Clinic, stabilizing 45 critically injured patients.',
            createdAt: serverTimestamp(), completedAt: serverTimestamp()
          });
          await addDoc(collection(db, 'clusters'), {
            issueType: 'shelter', location: 'Downtown Evacuation Center', combinedAffectedCount: 320,
            urgencyLevel: 'Critical', clusterReason: 'Multiple reports of displaced families arriving at the downtown center without basic supplies.',
            createdAt: serverTimestamp(), status: 'open',
            predictedResources: [
              { item: 'Emergency Blankets', quantity: 320, unit: 'Pieces', importance: 'High' },
              { item: 'Drinking Water', quantity: 960, unit: 'Liters', importance: 'High' },
              { item: 'First Aid Kits', quantity: 30, unit: 'Kits', importance: 'Medium' }
            ]
          });
          localStorage.setItem('demoSeeded', 'true');
          console.log("Demo data seeded successfully.");
        } catch (e) {
          console.error("Auto-seed failed:", e);
        }
      }
    };
    seedData();
  }, []);
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
