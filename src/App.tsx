import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Menu, X, Calculator, BookOpen, ShoppingBag, Layers, Github } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/DearMJZ-2U/QQfarm_up';
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
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  color: string;
  emoji: string;
}

const bottomTabs: TabDef[] = [
  { id: 'calc', Icon: Calculator, label: '计算', color: 'leaf', emoji: '🧮' },
  { id: 'atlas', Icon: BookOpen, label: '图鉴', color: 'orange', emoji: '📖' },
  { id: 'items', Icon: ShoppingBag, label: '道具', color: 'berry', emoji: '🛒' },
  { id: 'more', Icon: Layers, label: '更多', color: 'plum', emoji: '📋' },
];

interface SidebarItem {
  icon: string;
  label: string;
  id: string;
  count?: number;
  frozen?: boolean;
  color?: string;
}

const sidebarSections: { title?: string; items: SidebarItem[] }[] = [
  {
    items: [
      { icon: '🏠', label: '首页', id: 'calc', color: 'leaf' },
      { icon: '🧮', label: '经验计算器', id: 'calc', color: 'leaf' },
      { icon: '📊', label: '等级查询', id: 'more_level', color: 'plum' },
    ]
  },
  {
    title: '图鉴',
    items: [
      { icon: '🌿', label: '作物图鉴', id: 'crops', count: 134, color: 'leaf' },
      { icon: '🏞️', label: '土地图鉴', id: 'lands', count: 24, color: 'orange' },
      { icon: '🧬', label: '变异图鉴', id: 'atlas_mutation', color: 'berry' },
      { icon: '🏡', label: '装扮图鉴', id: 'atlas_costume', count: 13, color: 'sky' },
    ]
  },
  {
    title: '商店道具',
    items: [
      { icon: '🌱', label: '种子', id: 'items_seed', count: 134, color: 'leaf' },
      { icon: '✨', label: '黄金果实', id: 'items', count: 18, color: 'sun' },
      { icon: '💰', label: '货币与计数', id: 'items', count: 9, color: 'sun' },
      { icon: '🛠️', label: '操作工具', id: 'items', count: 8, color: 'sky' },
      { icon: '🧪', label: '化肥道具', id: 'items', count: 8, color: 'leaf' },
      { icon: '🎨', label: '头像框与装饰', id: 'items', count: 7, color: 'plum' },
      { icon: '🐕', label: '狗与看门犬', id: 'items', count: 5, color: 'orange' },
      { icon: '🦴', label: '狗粮', id: 'items', count: 3, color: 'earth' },
      { icon: '🎟', label: '活动货币', id: 'items', count: 2, color: 'berry' },
      { icon: '💎', label: '充值货币', id: 'items', count: 1, frozen: true },
    ]
  },
];

const atlasSubTabsDef = [
  { id: 'crops' as const, label: '作物', emoji: '🌿', color: 'leaf' },
  { id: 'costume' as const, label: '装扮', emoji: '🏡', color: 'sky' },
  { id: 'lands' as const, label: '土地', emoji: '🏞️', color: 'orange' },
  { id: 'mutation' as const, label: '变异', emoji: '🧬', color: 'berry' },
];

export default function App() {
  const [bottomTab, setBottomTab] = useState<BottomTab>('calc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('qqfarm_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [atlasSubTab, setAtlasSubTab] = useState<'crops' | 'lands' | 'mutation' | 'costume'>('crops');

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('qqfarm_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('qqfarm_theme', next);
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
  };

  const renderContent = () => {
    switch (bottomTab) {
      case 'calc':
        return <CalculatorTab />;
      case 'atlas':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4">
            {/* Atlas sub-tabs — chunky sticker pills */}
            <div className="sticky top-[68px] sm:top-[76px] z-20 pt-3 pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4"
              style={{ background: 'linear-gradient(to bottom, var(--bg) 70%, transparent)' }}>
              <div className="flex gap-1.5 p-1.5 sticker-pop rounded-full overflow-x-auto no-scrollbar">
                {atlasSubTabsDef.map(t => {
                  const active = atlasSubTab === t.id;
                  return (
                    <button key={t.id} onClick={() => setAtlasSubTab(t.id)}
                      className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                        active
                          ? `bg-[var(--${t.color})] text-white shadow-[0_2px_0_var(--${t.color}-deep)]`
                          : 'text-[var(--ink-soft)] hover:bg-[var(--bg-2)]'
                      }`}
                      style={active ? { background: `var(--${t.color})`, boxShadow: `0 2px 0 var(--${t.color}-deep)` } : {}}>
                      <span className="text-base">{t.emoji}</span><span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              {atlasSubTab === 'crops' && <CropAtlasTab />}
              {atlasSubTab === 'lands' && <LandAtlasTab />}
              {atlasSubTab === 'mutation' && <MutationAtlasTab />}
              {atlasSubTab === 'costume' && <CostumeAtlasTab />}
            </div>
          </div>
        );
      case 'items':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4">
            <ItemsTab />
          </div>
        );
      case 'more':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4">
            <LevelSearchTab />
          </div>
        );
      default:
        return <CalculatorTab />;
    }
  };

  return (
    <div className="min-h-screen text-[var(--ink)] font-body relative">

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div
              key="sidebar-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] h-full overflow-y-auto flex-shrink-0"
              style={{ background: 'var(--bg-paper)' }}>

              {/* Sidebar Header */}
              <div className="sticky top-0 z-10 px-5 py-5 flex items-center justify-between"
                style={{ background: 'var(--bg-paper)', borderBottom: '1.5px solid var(--line)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: 'var(--leaf)', boxShadow: '0 2px 0 var(--leaf-deep)' }}>
                    <span>🌾</span>
                  </div>
                  <div className="leading-tight">
                    <div className="font-display italic text-lg font-bold text-[var(--ink)]">QQ农场收益计算器</div>
                    <div className="text-[10px] text-[var(--ink-mute)] font-body tracking-wide">QQ 经典农场 · 收益指南</div>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-2)' }}>
                  <X size={16} className="text-[var(--ink-soft)]" />
                </button>
              </div>

              <nav className="px-3 py-4 space-y-5">
                {sidebarSections.map((section, si) => (
                  <div key={si}>
                    {section.title && (
                      <div className="section-eyebrow px-3 pb-3">{section.title}</div>
                    )}
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const color = item.color || 'leaf';
                        return (
                          <button
                            key={item.id + item.label}
                            onClick={() => !item.frozen && handleSidebarClick(item.id)}
                            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                              item.frozen ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--bg-2)]'
                            }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-transform ${
                              !item.frozen && 'group-hover:scale-110 group-hover:-rotate-6'
                            }`}
                              style={{ background: `var(--${color}-bg)` }}>
                              <span className={item.frozen ? 'grayscale' : ''}>{item.icon}</span>
                            </div>
                            <span className={`font-bold truncate text-[var(--ink)] ${item.frozen ? 'line-through' : ''}`}>
                              {item.label}
                            </span>
                            {item.count !== undefined && (
                              <span className="ml-auto text-[10px] font-mono font-bold text-[var(--ink-mute)] tnum">
                                {item.frozen ? '🔒' : item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Theme toggle */}
                <div className="pt-3" style={{ borderTop: '1.5px solid var(--line)' }}>
                  <button onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[var(--bg-2)] text-sm">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                      style={{ background: theme === 'dark' ? 'var(--sun-bg)' : 'var(--sky-bg)' }}>
                      {theme === 'dark' ? '☀️' : '🌙'}
                    </div>
                    <span className="font-bold text-[var(--ink)]">
                      {theme === 'dark' ? '切换浅色' : '切换深色'}
                    </span>
                  </button>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 px-3 sm:px-4 pt-3 sm:pt-4 pb-2"
          style={{ background: 'linear-gradient(to bottom, var(--bg) 60%, color-mix(in srgb, var(--bg) 80%, transparent))' }}>
          <div className="container-app flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-pop)' }}>
            <button onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors flex-shrink-0"
              aria-label="菜单">
              <Menu size={18} className="text-[var(--ink-soft)]" strokeWidth={2.5} />
            </button>
            <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
              <span className="text-xl float-anim inline-block flex-shrink-0">🌾</span>
              <div className="leading-tight text-center min-w-0">
                <div className="font-display italic text-base sm:text-lg font-bold text-[var(--ink)] tracking-wide truncate">QQ农场收益计算器</div>
                <div className="text-[9px] text-[var(--ink-mute)] tracking-widest uppercase -mt-0.5 hidden sm:block">QQ Farm Guide</div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <a href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full hover:bg-[var(--bg-2)] transition-colors text-xs font-bold whitespace-nowrap"
                aria-label="GitHub 仓库"
                title="GitHub 仓库">
                <Github size={16} strokeWidth={2.5} className="text-[var(--ink-soft)] flex-shrink-0" />
                <span className="text-[var(--ink-soft)]">GitHub</span>
              </a>
              <button onClick={toggleTheme}
                className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full hover:bg-[var(--bg-2)] transition-colors text-xs font-bold whitespace-nowrap"
                aria-label="切换主题"
                title="切换主题">
                {theme === 'dark' ? (
                  <>
                    <Sun size={16} strokeWidth={2.5} style={{ color: 'var(--sun-deep)' }} className="flex-shrink-0" />
                    <span className="text-[var(--ink-soft)]">日间</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} strokeWidth={2.5} style={{ color: 'var(--sky-deep)' }} className="flex-shrink-0" />
                    <span className="text-[var(--ink-soft)]">夜间</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-2">
          {renderContent()}
        </div>
      </div>

      {/* Bottom Navigation — 圆胖 sticker 风 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-3 sm:px-4 pb-3 safe-area-pb pointer-events-none">
        <div className="container-app pointer-events-auto">
          <div className="flex items-center gap-1.5 p-1.5 rounded-full"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-sticker-lg)' }}>
            {bottomTabs.map(tab => {
              const active = bottomTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setBottomTab(tab.id)}
                  aria-label={tab.label}
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-xs transition-all"
                  style={active ? {
                    background: `var(--${tab.color})`,
                    color: 'white',
                    boxShadow: `0 2px 0 var(--${tab.color}-deep)`,
                  } : {
                    color: 'var(--ink-mute)',
                  }}>
                  <Icon size={16} strokeWidth={2.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
