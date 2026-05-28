import React, { useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import CalculatorTab from './components/CalculatorTab';
import LevelSearchTab from './components/LevelSearchTab';
import LandAtlasTab from './components/LandAtlasTab';
import CropAtlasTab from './components/CropAtlasTab';
import ItemsTab from './components/ItemsTab';
import MutationAtlasTab from './components/MutationAtlasTab';
import CostumeAtlasTab from './components/CostumeAtlasTab';

type BottomTab = 'calc' | 'atlas' | 'items' | 'more';

interface TabDef {
  id: BottomTab;
  icon: string;
  label: string;
}

const bottomTabs: TabDef[] = [
  { id: 'calc', icon: '🧮', label: '计算' },
  { id: 'atlas', icon: '📖', label: '图鉴' },
  { id: 'items', icon: '🛒', label: '道具' },
  { id: 'more', icon: '📋', label: '更多' },
];

interface SidebarItem {
  icon: string;
  label: string;
  id: string;
  count?: number;
  frozen?: boolean;
}

const sidebarSections: { title?: string; items: SidebarItem[] }[] = [
  {
    items: [
      { icon: '🏠', label: '首页', id: 'calc' },
      { icon: '🧮', label: '经验计算器', id: 'calc' },
      { icon: '📊', label: '等级查询', id: 'more_level' },
    ]
  },
  {
    title: '图鉴',
    items: [
      { icon: '🌿', label: '作物图鉴', id: 'crops', count: 134 },
      { icon: '🏞️', label: '土地图鉴', id: 'lands', count: 24 },
      { icon: '🧬', label: '变异图鉴', id: 'atlas_mutation' },
      { icon: '🏡', label: '装扮图鉴', id: 'atlas_costume', count: 13 },
    ]
  },
  {
    title: '商店道具',
    items: [
      { icon: '🌱', label: '种子', id: 'items_seed', count: 134 },
      { icon: '✨', label: '黄金果实', id: 'items', count: 18 },
      { icon: '💰', label: '货币与计数', id: 'items', count: 9 },
      { icon: '🛠️', label: '操作工具', id: 'items', count: 8 },
      { icon: '🧪', label: '化肥道具', id: 'items', count: 8 },
      { icon: '🎨', label: '头像框与装饰', id: 'items', count: 7 },
      { icon: '🐕', label: '狗与看门犬', id: 'items', count: 5 },
      { icon: '🦴', label: '狗粮', id: 'items', count: 3 },
      { icon: '🎟', label: '活动货币', id: 'items', count: 2 },
      { icon: '💎', label: '充值货币', id: 'items', count: 1, frozen: true },
    ]
  },
];

export default function App() {
  const [bottomTab, setBottomTab] = useState<BottomTab>('calc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sub-tabs within main tabs
  const [atlasSubTab, setAtlasSubTab] = useState<'crops' | 'lands' | 'mutation' | 'costume'>('crops');

  React.useEffect(() => {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    const savedTheme = localStorage.getItem('qqfarm_theme') as 'light' | 'dark' | null;
    const initial = savedTheme || (isDay ? 'light' : 'dark');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('qqfarm_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleSidebarClick = (id: string) => {
    setSidebarOpen(false);
    if (id === 'calc') { setBottomTab('calc'); return; }
    if (id === 'more_level') { setBottomTab('more'); return; }
    if (id === 'crops') { setAtlasSubTab('crops'); setBottomTab('atlas'); return; }
    if (id === 'lands') { setAtlasSubTab('lands'); setBottomTab('atlas'); return; }
    if (id === 'atlas_mutation') { setAtlasSubTab('mutation'); setBottomTab('atlas'); return; }
    if (id === 'atlas_costume') { setAtlasSubTab('costume'); setBottomTab('atlas'); return; }
    if (id === 'items_seed') { setBottomTab('items'); return; }
    // Other items are frozen - just close sidebar
  };

  const renderContent = () => {
    switch (bottomTab) {
      case 'calc':
        return <CalculatorTab />;
      case 'atlas':
        return (
          <div className="fade-in pb-16 px-1 max-w-5xl mx-auto">
            {/* Atlas sub-tabs */}
            <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 mb-4 sticky top-0 z-10 backdrop-blur-sm">
              {[
                { id: 'crops' as const, label: '🌿 作物' },
                { id: 'lands' as const, label: '🏞️ 土地' },
                { id: 'mutation' as const, label: '🧬 变异' },
                { id: 'costume' as const, label: '🏡 装扮' },
              ].map(t => (
                <button key={t.id} onClick={() => setAtlasSubTab(t.id)} className={`flex-1 text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors ${atlasSubTab === t.id ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
              ))}
            </div>
            {atlasSubTab === 'crops' && <CropAtlasTab />}
            {atlasSubTab === 'lands' && <LandAtlasTab />}
            {atlasSubTab === 'mutation' && <MutationAtlasTab />}
            {atlasSubTab === 'costume' && <CostumeAtlasTab />}
          </div>
        );
      case 'items':
        return (
          <div className="fade-in pb-16 px-1 max-w-5xl mx-auto">
            <ItemsTab />
          </div>
        );
      case 'more':
        return (
          <div className="fade-in pb-16 px-1 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">📋 更多工具</h2>
              <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold glass-input rounded-lg px-3 py-1.5">
                <Menu size={14} /> 导航菜单
              </button>
            </div>
            <LevelSearchTab />
          </div>
        );
      default:
        return <CalculatorTab />;
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-slate-200 font-sans relative selection:bg-green-500/30 bg-slate-100/70 dark:bg-slate-950">

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-white h-full overflow-y-auto flex-shrink-0 animate-[slideIn_0.25s_ease]">
            <div className="sticky top-0 bg-slate-900 z-10 flex items-center justify-between px-4 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌾</span>
                <span className="font-bold text-sm">QQ经典农场</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                <X size={18} />
              </button>
            </div>
            <nav className="px-3 py-3 space-y-4">
              {sidebarSections.map((section, si) => (
                <div key={si}>
                  {section.title && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-2">{section.title}</div>}
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.id + item.label}
                        onClick={() => !item.frozen && handleSidebarClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${item.frozen ? 'opacity-35 cursor-not-allowed' : 'hover:bg-white/10'}`}
                      >
                        <span className={item.frozen ? 'grayscale opacity-50' : ''}>{item.icon}</span>
                        <span className={`font-medium truncate ${item.frozen ? 'line-through decoration-slate-500' : ''}`}>{item.label}</span>
                        {item.count && <span className="ml-auto text-[10px] text-slate-500">{item.frozen ? '🔒' : item.count}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700/50">
                <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm">
                  <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span className="font-medium">{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen pb-4">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌾</span>
            <span className="font-bold text-sm">QQ经典农场</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition">
            {theme === 'dark' ? <Sun size={18} className="text-orange-400" /> : <Moon size={18} className="text-blue-500" />}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-3 pt-3">
          {renderContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-black/5 dark:border-white/5 safe-area-pb">
        <div className="flex items-center justify-around max-w-5xl mx-auto">
          {bottomTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 min-w-[60px] transition-colors ${bottomTab === tab.id ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {bottomTab === tab.id && <div className="absolute bottom-0 w-8 h-0.5 bg-green-500 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .fade-in {
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}