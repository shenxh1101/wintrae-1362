import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Calendar, PawPrint, Stethoscope, RotateCcw } from 'lucide-react';
import Layout from "@/components/layout/Layout";
import Visits from "@/pages/Visits";
import Medications from "@/pages/Medications";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center mb-6 shadow-soft">
        <Icon className="w-10 h-10 text-brand-500" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500 text-center max-w-md">{description}</p>
      <div className="mt-8 card p-8 w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-soft" />
          <p className="text-sm font-medium text-gray-700">模块开发中</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
        <div className="mt-4 h-12 rounded-xl bg-gray-50 animate-pulse" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route
            path="/calendar"
            element={
              <PagePlaceholder
                title="日历排班"
                description="管理每日预约排班，查看医生和诊室的时间安排"
                icon={Calendar}
              />
            }
          />
          <Route
            path="/pets"
            element={
              <PagePlaceholder
                title="宠物档案"
                description="管理宠物基本信息、疫苗记录、健康档案等"
                icon={PawPrint}
              />
            }
          />
          <Route path="/visits" element={<Visits />} />
          <Route path="/medications" element={<Medications />} />
          <Route
            path="/followups"
            element={
              <PagePlaceholder
                title="回访看板"
                description="跟踪术后、疫苗和满意度回访情况"
                icon={RotateCcw}
              />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Router>
  );
}
