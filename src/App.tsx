import { useState, useEffect, useCallback } from 'react';
import type { ArtItem } from './types';
import { useItems } from './hooks/useItems';
import { HomeView } from './components/HomeView';
import { CollectionView } from './components/CollectionView';
import { AddView } from './components/AddView';
import { TreasureMapListView } from './components/TreasureMapListView';
import { TreasureMapDetailView } from './components/TreasureMapDetailView';
import { ResetModal } from './components/ResetModal';
import './App.css';

type View = 'home' | 'collection' | 'add' | 'treasureMapList' | 'treasureMapDetail';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const {
    items,
    treasureMaps,
    loading,
    saveStatus,
    addItem,
    updateItem,
    deleteItem,
    cycleStatus,
    importItems,
    addTreasureMap,
    deleteTreasureMap,
    updateTreasureMapItemStatus,
    resetData,
  } = useItems();
  const [currentTreasureMapId, setCurrentTreasureMapId] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<{
    title: string;
    domain: string;
    description: string;
    hints?: string;
    treasureMapId: string;
    treasureMapItemId: string;
  } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Scroll to top on view change
  useEffect(() => {
    if (!loading) {
      window.scrollTo(0, 0);
    }
  }, [currentView, loading]);

  // Browser back/forward button support
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const view = e.state?.view as View | undefined;
      if (view) {
        setCurrentView(view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Set initial history state (replace current entry, don't push)
    window.history.replaceState({ view: 'home' }, '');

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view: View) => {
    window.history.pushState({ view }, '');
    setCurrentView(view);
  }, []);

  const navigateToHome = () => navigateTo('home');
  const navigateToCollection = () => navigateTo('collection');
  const navigateToAdd = () => navigateTo('add');
  const navigateToTreasureMapList = () => navigateTo('treasureMapList');
  const navigateToTreasureMapDetail = (id: string) => {
    setCurrentTreasureMapId(id);
    navigateTo('treasureMapDetail');
  };

  const handleExplore = (
    treasureMapId: string,
    itemId: string,
    title: string,
    domain: string,
    description: string,
    hints?: string
  ) => {
    setPrefillData({
      title,
      domain,
      description,
      hints,
      treasureMapId,
      treasureMapItemId: itemId,
    });
    navigateTo('add');
  };

  const handleAddFromTreasureMap = async (item: Omit<ArtItem, 'createdAt' | 'updatedAt'>) => {
    const newItem = await addItem(item);

    // 如果是从寻宝图来的，更新寻宝图状态
    if (prefillData) {
      await updateTreasureMapItemStatus(
        prefillData.treasureMapId,
        prefillData.treasureMapItemId,
        'explored',
        newItem.id
      );
      setPrefillData(null);
    }

    return newItem;
  };

  const currentTreasureMap = currentTreasureMapId
    ? treasureMaps.find((tm) => tm.id === currentTreasureMapId)
    : null;

  if (loading) {
    return (
      <div className="view active" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Alibaba PuHuiTi, sans-serif', color: 'var(--textMuted)' }}>
          加载中...
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`save-status ${saveStatus !== 'idle' ? 'show' : ''} ${saveStatus === 'saving' ? 'saving' : saveStatus === 'saved' ? 'saved' : 'local-only'}`}
      >
        {saveStatus === 'saving' && '保存中...'}
        {saveStatus === 'saved' && '✓ 已保存'}
        {saveStatus === 'local-only' && '✓ 仅存本地'}
      </div>

      {currentView === 'home' && (
        <div className="view active">
          <HomeView
            items={items}
            treasureMaps={treasureMaps}
            onNavigateToAdd={navigateToAdd}
            onNavigateToCollection={navigateToCollection}
            onNavigateToTreasureMapList={navigateToTreasureMapList}
          />
        </div>
      )}

      {currentView === 'collection' && (
        <div className="view active">
          <CollectionView
            items={items}
            treasureMaps={treasureMaps}
            onNavigateToHome={navigateToHome}
            onNavigateToAdd={navigateToAdd}
            onCycleStatus={cycleStatus}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onImport={importItems}
            onReset={() => setShowResetModal(true)}
          />
        </div>
      )}

      {currentView === 'add' && (
        <div className="view active">
          <AddView
            isActive={true}
            prefillData={prefillData}
            onNavigateToHome={navigateToHome}
            onNavigateToCollection={navigateToCollection}
            onAdd={handleAddFromTreasureMap}
          />
        </div>
      )}

      {currentView === 'treasureMapList' && (
        <div className="view active">
          <TreasureMapListView
            treasureMaps={treasureMaps}
            onNavigateToHome={navigateToHome}
            onNavigateToDetail={navigateToTreasureMapDetail}
            onAddTreasureMap={addTreasureMap}
            onDeleteTreasureMap={deleteTreasureMap}
          />
        </div>
      )}

      {currentView === 'treasureMapDetail' && currentTreasureMap && (
        <div className="view active">
          <TreasureMapDetailView
            treasureMap={currentTreasureMap}
            allItems={items}
            onNavigateToList={navigateToTreasureMapList}
            onExplore={handleExplore}
            onNavigateToCollection={(_itemId) => {
              // 展开到藏宝阁并定位到该藏品
              navigateToCollection();
            }}
          />
        </div>
      )}

      {showResetModal && (
        <ResetModal
          onClose={() => setShowResetModal(false)}
          onReset={resetData}
        />
      )}
    </>
  );
}

export default App;
