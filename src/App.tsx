import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Calendar from "@/pages/Calendar";
import Pets from "@/pages/Pets";
import Visits from "@/pages/Visits";
import Medications from "@/pages/Medications";
import Followups from "@/pages/Followups";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/followups" element={<Followups />} />
        </Route>
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Router>
  );
}
