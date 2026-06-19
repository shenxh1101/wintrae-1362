import { NavLink } from 'react-router-dom';
import { Calendar, PawPrint, Pill, RotateCcw, Stethoscope } from 'lucide-react';

interface MenuItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { to: '/calendar', label: '日历排班', icon: Calendar },
  { to: '/pets', label: '宠物档案', icon: PawPrint },
  { to: '/visits', label: '接诊记录', icon: Stethoscope },
  { to: '/medications', label: '用药提醒', icon: Pill },
  { to: '/followups', label: '回访看板', icon: RotateCcw },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xl shadow-soft">
            🐾
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-tight">爱心宠物医院</h1>
            <p className="text-xs text-gray-400 mt-0.5">Pet Clinic System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
          导航菜单
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'sidebar-item-active' : 'sidebar-item'
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="card p-4 bg-gradient-to-br from-brand-50 to-info-50 border-brand-100/60">
          <p className="text-xs font-medium text-brand-700 mb-1">今日统计</p>
          <p className="text-2xl font-bold text-brand-600">12</p>
          <p className="text-xs text-gray-500 mt-1">待处理预约</p>
        </div>
      </div>
    </aside>
  );
}
