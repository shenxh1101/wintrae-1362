import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { cn, formatDate } from '@/utils/format';
import { useAppStore } from '@/store/useAppStore';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const routeTitles: Record<string, { title: string; breadcrumbs: BreadcrumbItem[] }> = {
  '/calendar': {
    title: '日历排班',
    breadcrumbs: [{ label: '首页', to: '/calendar' }, { label: '日历排班' }],
  },
  '/pets': {
    title: '宠物档案',
    breadcrumbs: [{ label: '首页', to: '/calendar' }, { label: '宠物档案' }],
  },
  '/visits': {
    title: '接诊记录',
    breadcrumbs: [{ label: '首页', to: '/calendar' }, { label: '接诊记录' }],
  },
  '/medications': {
    title: '用药提醒',
    breadcrumbs: [{ label: '首页', to: '/calendar' }, { label: '用药提醒' }],
  },
  '/followups': {
    title: '回访看板',
    breadcrumbs: [{ label: '首页', to: '/calendar' }, { label: '回访看板' }],
  },
};

export default function Header() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { doctors, appointments, medicationReminders } = useAppStore();

  const currentDoctor = doctors[0];
  const routeInfo = routeTitles[location.pathname] || {
    title: '仪表盘',
    breadcrumbs: [{ label: '首页', to: '/calendar' }],
  };

  const pendingCount = appointments.filter((a) => a.status === 'scheduled').length;
  const reminderCount = medicationReminders.filter((r) => r.status === 'pending').length;
  const totalNotifications = pendingCount + reminderCount;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-100/80 sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">{routeInfo.title}</h2>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            {routeInfo.breadcrumbs.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-gray-300">/</span>}
                {item.to ? (
                  <Link to={item.to} className="hover:text-brand-600 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{item.label}</span>
                )}
              </span>
            ))}
            <span className="ml-2 text-gray-300">·</span>
            <span className="text-gray-400">{formatDate(new Date(), 'yyyy年MM月dd日 EEEE')}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="搜索宠物、主人、预约..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-72 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
          </div>

          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalNotifications > 99 ? '99+' : totalNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 card shadow-hover overflow-hidden animate-slide-up z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">通知中心</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingCount > 0 && (
                    <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-info-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">
                            {pendingCount} 个待确认预约
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">请及时处理预约请求</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {reminderCount > 0 && (
                    <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-accent-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">
                            {reminderCount} 条用药提醒待发送
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">点击查看详情</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {totalNotifications === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-400">暂无新通知</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                  <button className="w-full text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">
                    查看全部通知
                  </button>
                </div>
              </div>
            )}
          </div>

          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className={cn(
                'flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all duration-200',
                showUserMenu ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-info-500 flex items-center justify-center text-white font-semibold shadow-soft overflow-hidden">
                {currentDoctor?.avatarEmoji ? (
                  <span className="text-lg">{currentDoctor.avatarEmoji}</span>
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {currentDoctor?.name || '医生'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{currentDoctor?.title || '主治医生'}</p>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 card shadow-hover overflow-hidden animate-slide-up z-50">
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-info-500 flex items-center justify-center text-white font-semibold shadow-soft">
                      {currentDoctor?.avatarEmoji ? (
                        <span className="text-xl">{currentDoctor.avatarEmoji}</span>
                      ) : (
                        <UserIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {currentDoctor?.name || '医生'}
                      </p>
                      <p className="text-xs text-gray-400">{currentDoctor?.title || '主治医生'}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    个人资料
                  </button>
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                    系统设置
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
