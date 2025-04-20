import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Protected from './components/Protected';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyTrainings from './pages/MyTrainings';
import TakeAssessment from './pages/TakeAssessment';
import Notifications from './pages/Notifications';
import SetAssessments from './pages/trainer/SetAssessments';
import Evaluate from './pages/trainer/Evaluate';
import TrainingStatus from './pages/dtc/TrainingStatus';
import AssignTraining from './pages/dtc/AssignTraining';
import Notify from './pages/dtc/Notify';
import Reports from './pages/stc/Reports';
import Users from './pages/admin/Users';
import AuditTrail from './pages/admin/AuditTrail';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/my-trainings" element={<Protected minLevel="USER"><MyTrainings /></Protected>} />
        <Route path="/assessment/:id" element={<Protected minLevel="USER"><TakeAssessment /></Protected>} />
        <Route path="/notifications" element={<Protected minLevel="USER"><Notifications /></Protected>} />
        <Route path="/trainer/assessments" element={<Protected minLevel="TRAINER"><SetAssessments /></Protected>} />
        <Route path="/trainer/evaluate" element={<Protected minLevel="TRAINER"><Evaluate /></Protected>} />
        <Route path="/dtc/status" element={<Protected minLevel="DTC"><TrainingStatus /></Protected>} />
        <Route path="/dtc/assign" element={<Protected minLevel="DTC"><AssignTraining /></Protected>} />
        <Route path="/dtc/notify" element={<Protected minLevel="DTC"><Notify /></Protected>} />
        <Route path="/stc/reports" element={<Protected minLevel="STC"><Reports /></Protected>} />
        <Route path="/admin/users" element={<Protected adminOnly><Users /></Protected>} />
        <Route path="/admin/audit" element={<Protected adminOnly><AuditTrail /></Protected>} />
      </Route>
    </Routes>
  );
}
