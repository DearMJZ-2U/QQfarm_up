import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Menu, X, Calculator, BookOpen, ShoppingBag, Wrench, Github, Home as HomeIcon } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/DearMJZ-2U/QQfarm_up';
import CalculatorTab from './components/CalculatorTab';
import LevelSearchTab from './components/LevelSearchTab';
import LandUpgradeCalcTab from './components/LandUpgradeCalcTab';
import LandAtlasTab from './components/LandAtlasTab';
import CropAtlasTab from './components/CropAtlasTab';
import ItemsTab from './components/ItemsTab';
import MutationAtlasTab from './components/MutationAtlasTab';
import CostumeAtlasTab from './components/CostumeAtlasTab';
import HomeTab from './components/HomeTab';
import BackToTop from './components/BackToTop';
import { CategoryNav, type CategoryNavItem } from './components/shared';

// 动态数据：count 从 JSON 实时读取，不再硬编码
import seedsData from './data/seeds.json';
import itemsData from './data/items.json';
import landsData from './data/lands_atlas.json';
import costumeData from './data/costume_atlas.json';
import mutationData from './data/mutation_atlas.json';

type BottomTab = 'home' | 'calc' | 'atlas' | 'items' | 'tools';
type AtlasSubTab = 'crops' | 'lands' | 'mutation' | 'costume';
type ToolsSubTab = 'level' | 'land';
type ItemCategoryId = string;

interface TabDef {
  id: BottomTab;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  color: string;
  emoji: string;
}

// 底栏 5 个 tab：首页 / 计算器 / 图鉴 / 道具 / 工具
const bottomTabs: TabDef[] = [
  { id: 'home', Icon: HomeIcon, label: '首页', color: 'leaf', emoji: '🏠' },
  { id: 'calc', Icon: Calculator, label: '计算器', color: 'leaf', emoji: '🧮' },
  { id: 'atlas', Icon: BookOpen, label: '图鉴', color: 'orange', emoji: '📖' },
  { id: 'items', Icon: ShoppingBag, label: '道具', color: 'berry', emoji: '🛒' },
  { id: 'tools', Icon: Wrench, label: '工具', color: 'plum', emoji: '🛠️' },
];

// 动态计算各图鉴分类的 count
const atlasSubTabCount = (id: AtlasSubTab): number => {
  if (id === 'crops') return (seedsData as any).count || (seedsData as any).rows?.length || 0;
  if (id === 'lands') return (landsData as any).plots?.length || 0;
  if (id === 'costume') return (costumeData as any).categories?.reduce((s: number, c: any) => s + c.items.length, 0) || 0;
  // mutation: 变异类型 + 黄金果实 + 装扮果实 + 活动果实
  const m = mutationData as any;
  const golden = m.goldenAtlas ? (m.goldenAtlas.goldenFruit?.length || 0) + (m.goldenAtlas.costumeFruit?.length || 0) + (m.goldenAtlas.eventFruit?.length || 0) : 0;
  return (m.mutationTypes?.length || 0) + golden;
};

const atlasSubTabsDef: Array<{ id: AtlasSubTab; label: string; emoji: string; color: 'leaf' | 'orange' | 'sun' | 'berry' | 'sky' | 'plum' }> = [
  { id: 'crops', label: '作物', emoji: '🌿', color: 'leaf' },
  { id: 'costume', label: '装扮', emoji: '🏡', color: 'sky' },
  { id: 'lands', label: '土地', emoji: '🏞️', color: 'orange' },
  { id: 'mutation', label: '变异', emoji: '🧬', color: 'berry' },
];

// 动态构建侧边栏：count 从 items.json 实时读取
const HIDDEN_ITEM_IDS = new Set([2101, 2102, 2103]);
function itemsCountFor(catId: string): number {
  const cat = (itemsData as any).categories.find((c: any) => c.id === catId);
  if (!cat) return 0;
  return (cat.items || []).filter((it: any) => !HIDDEN_ITEM_IDS.has(it.id)).length;
}

interface SidebarItem {
  icon: string;
  label: string;
  id: string;
  count?: number;
  frozen?: boolean;
  color?: string;
}

function buildSidebarSections(): { title?: string; items: SidebarItem[] }[] {
  const cropsCount = (seedsData as any).count || (seedsData as any).rows?.length || 0;
  const costumeCount = (costumeData as any).categories?.reduce((s: number, c: any) => s + c.items.length, 0) || 0;
  const landsCount = (landsData as any).plots?.length || 0;
  const mutationCount = atlasSubTabCount('mutation');

  return [
    {
      items: [
        { icon: '🏠', label: '首页', id: 'home', color: 'leaf' },
        { icon: '🧮', label: '经验计算器', id: 'calc', color: 'leaf' },
        { icon: '📊', label: '等级查询', id: 'tools_level', color: 'plum' },
        { icon: '🟪', label: '土地升级所需', id: 'tools_land', color: 'plum' },
      ]
    },
    {
      title: '图鉴',
      items: [
        { icon: '🌿', label: '作物图鉴', id: 'crops', count: cropsCount, color: 'leaf' },
        { icon: '🏡', label: '装扮图鉴', id: 'atlas_costume', count: costumeCount, color: 'sky' },
        { icon: '🏞️', label: '土地图鉴', id: 'lands', count: landsCount, color: 'orange' },
        { icon: '🧬', label: '变异图鉴', id: 'atlas_mutation', count: mutationCount, color: 'berry' },
      ]
    },
    {
      title: '商店道具',
      items: [
        { icon: '🌱', label: '种子', id: 'items_05', count: itemsCountFor('05'), color: 'leaf' },
        { icon: '✨', label: '黄金果实', id: 'items_17', count: itemsCountFor('17'), color: 'sun' },
        { icon: '💰', label: '货币与计数', id: 'items_02', count: itemsCountFor('02'), color: 'sun' },
        { icon: '🛠️', label: '操作工具', id: 'items_04', count: itemsCountFor('04'), color: 'sky' },
        { icon: '🧪', label: '化肥道具', id: 'items_07', count: itemsCountFor('07'), color: 'leaf' },
        { icon: '🎨', label: '头像框与装饰', id: 'items_10', count: itemsCountFor('10'), color: 'plum' },
        { icon: '🐕', label: '狗与看门犬', id: 'items_08', count: itemsCountFor('08'), color: 'orange' },
        { icon: '🦴', label: '狗粮', id: 'items_09', count: itemsCountFor('09'), color: 'earth' },
        { icon: '🎟', label: '活动货币', id: 'items_19', count: itemsCountFor('19'), color: 'berry' },
        { icon: '💎', label: '充值货币', id: 'items_15', count: itemsCountFor('15'), frozen: true },
      ]
    },
  ];
}

export default function App() {
  const [bottomTab, setBottomTab] = useState<BottomTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('qqfarm_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [atlasSubTab, setAtlasSubTab] = useState<AtlasSubTab>('crops');
  const [toolsSubTab, setToolsSubTab] = useState<ToolsSubTab>('level');
  const [itemsCatId, setItemsCatId] = useState<ItemCategoryId>('05');

  const sidebarSections = useMemo(() => buildSidebarSections(), []);

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

  // 统一导航入口：写入浏览器历史 + 切换 tab + 滚到顶部
  const navigate = React.useCallback((
    tab: BottomTab,
    subTab?: AtlasSubTab | ToolsSubTab | ItemCategoryId
  ) => {
    const isTools = tab === 'tools';
    const isAtlas = tab === 'atlas';
    const isItems = tab === 'items';
    const effectiveSubTab = subTab ?? (isAtlas ? atlasSubTab : isTools ? toolsSubTab : isItems ? itemsCatId : null);
    const currentSubTab = isAtlas ? atlasSubTab : isTools ? toolsSubTab : isItems ? itemsCatId : null;
    if (tab === bottomTab && effectiveSubTab === currentSubTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    history.pushState({ tab, subTab: effectiveSubTab as any }, '', '');
    setBottomTab(tab);
    if (isAtlas && subTab) setAtlasSubTab(subTab as AtlasSubTab);
    if (isTools && subTab) setToolsSubTab(subTab as ToolsSubTab);
    if (isItems && subTab) setItemsCatId(subTab as ItemCategoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [bottomTab, atlasSubTab, toolsSubTab, itemsCatId]);

  // 拦截浏览器后退
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    history.replaceState({ tab: 'home', subTab: null }, '', '');
    const onPopState = (e: PopStateEvent) => {
      const s = e.state as { tab?: BottomTab; subTab?: AtlasSubTab | ToolsSubTab | ItemCategoryId } | null;
      if (s && s.tab) {
        setBottomTab(s.tab);
        if (s.subTab) {
          if (s.tab === 'atlas') setAtlasSubTab(s.subTab as AtlasSubTab);
          if (s.tab === 'tools') setToolsSubTab(s.subTab as ToolsSubTab);
          if (s.tab === 'items') setItemsCatId(s.subTab as ItemCategoryId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 侧边栏直达：支持带分类参数跳转
  const handleSidebarClick = (id: string) => {
    setSidebarOpen(false);
    if (id === 'home') { navigate('home'); return; }
    if (id === 'calc') { navigate('calc'); return; }
    if (id === 'tools_level') { navigate('tools', 'level'); return; }
    if (id === 'tools_land') { navigate('tools', 'land'); return; }
    if (id === 'crops') { navigate('atlas', 'crops'); return; }
    if (id === 'lands') { navigate('atlas', 'lands'); return; }
    if (id === 'atlas_mutation') { navigate('atlas', 'mutation'); return; }
    if (id === 'atlas_costume') { navigate('atlas', 'costume'); return; }
    // 商店道具直达分类：items_05 → navigate('items', '05')
    if (id.startsWith('items_')) {
      const catId = id.substring(6);
      navigate('items', catId);
      return;
    }
  };

  // 首页导航入口
  const navigateFromHome = (target: string) => {
    if (target === 'calc') { navigate('calc'); return; }
    if (target === 'atlas') { navigate('atlas', 'crops'); return; }
    if (target === 'atlas_mutation') { navigate('atlas', 'mutation'); return; }
    if (target === 'atlas_costume') { navigate('atlas', 'costume'); return; }
    if (target === 'items_seed') { navigate('items', '05'); return; }
    if (target === 'items_gold') { navigate('items', '17'); return; }
    if (target === 'more_level') { navigate('tools', 'level'); return; }
    if (target === 'more_land') { navigate('tools', 'land'); return; }
  };

  const renderContent = () => {
    switch (bottomTab) {
      case 'home':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4 pt-3 sm:pt-4">
            <HomeTab onNavigate={navigateFromHome} />
          </div>
        );
      case 'calc':
        return <CalculatorTab />;
      case 'atlas':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-52 lg:flex-shrink-0">
                <CategoryNav
                  items={atlasSubTabsDef.map(t => ({
                    id: t.id,
                    label: t.label,
                    emoji: t.emoji,
                    color: t.color,
                    count: atlasSubTabCount(t.id),
                  }))}
                  value={atlasSubTab}
                  onChange={(id) => navigate('atlas', id as AtlasSubTab)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="sticker-lg overflow-hidden">
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-3 sm:p-4">
                    {atlasSubTab === 'crops' && <CropAtlasTab />}
                    {atlasSubTab === 'lands' && <LandAtlasTab />}
                    {atlasSubTab === 'mutation' && <MutationAtlasTab />}
                    {atlasSubTab === 'costume' && <CostumeAtlasTab />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'items':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4">
            <ItemsTab initialCategoryId={itemsCatId} />
          </div>
        );
      case 'tools':
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4">
            <div className="flex gap-1.5 p-1.5 sticker-pop rounded-full mb-4">
              <button onClick={() => navigate('tools', 'level')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs transition-all"
                style={toolsSubTab === 'level'
                  ? { background: 'var(--plum)', color: 'white', boxShadow: '0 2px 0 var(--plum-deep)' }
                  : { color: 'var(--ink-soft)' }}>
                📊 等级查询
              </button>
              <button onClick={() => navigate('tools', 'land')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-bold text-xs transition-all"
                style={toolsSubTab === 'land'
                  ? { background: 'var(--plum)', color: 'white', boxShadow: '0 2px 0 var(--plum-deep)' }
                  : { color: 'var(--ink-soft)' }}>
                🟪 土地升级所需
              </button>
            </div>
            {toolsSubTab === 'level' ? <LevelSearchTab /> : <LandUpgradeCalcTab />}
          </div>
        );
      default:
        return (
          <div className="fade-in pb-28 container-app px-3 sm:px-4 pt-3 sm:pt-4">
            <HomeTab onNavigate={navigateFromHome} />
          </div>
        );
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
                <span className="text-[var(--ink-soft)] hidden sm:inline">GitHub</span>
              </a>
              <button onClick={toggleTheme}
                className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full hover:bg-[var(--bg-2)] transition-colors text-xs font-bold whitespace-nowrap"
                aria-label="切换主题"
                title="切换主题">
                {theme === 'dark' ? (
                  <>
                    <Sun size={16} strokeWidth={2.5} style={{ color: 'var(--sun-deep)' }} className="flex-shrink-0" />
                    <span className="text-[var(--ink-soft)] hidden sm:inline">日间</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} strokeWidth={2.5} style={{ color: 'var(--sky-deep)' }} className="flex-shrink-0" />
                    <span className="text-[var(--ink-soft)] hidden sm:inline">夜间</span>
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
                <motion.button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  aria-label={tab.label}
                  aria-pressed={active}
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-xs transition-colors"
                  style={active ? {
                    background: `var(--${tab.color})`,
                    color: 'white',
                    boxShadow: `0 2px 0 var(--${tab.color}-deep)`,
                  } : {
                    color: 'var(--ink-mute)',
                  }}>
                  <Icon size={16} strokeWidth={2.5} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Back to top — PC only */}
      <BackToTop />
    </div>
  );
}
