import { useState, useEffect, useCallback, useRef } from 'react';
import type { ArtItem, StatusKey, TreasureMap } from '../types';
import {
  initDB,
  getAllItems,
  addItem as dbAddItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
  importFromJSON,
  getAllTreasureMaps,
  saveTreasureMap,
  deleteTreasureMap as dbDeleteTreasureMap,
  updateTreasureMapItem as dbUpdateTreasureMapItem,
  clearAllItems,
  clearAllTreasureMaps,
} from '../db';
import { AUTO_SAVE_DELAY, STATUS_CYCLE } from '../data/constants';

export function useItems() {
  const [items, setItems] = useState<ArtItem[]>([]);
  const [treasureMaps, setTreasureMaps] = useState<TreasureMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'local-only'>('idle');
  const saveTimerRef = useRef<number | null>(null);

  // 初始化数据库并加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const [itemsData, tmData] = await Promise.all([
          getAllItems(),
          getAllTreasureMaps(),
        ]);
        setItems(itemsData);
        setTreasureMaps(tmData);
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 防抖保存
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, AUTO_SAVE_DELAY);
  }, []);

  const addItem = useCallback(
    async (itemData: Omit<ArtItem, 'createdAt' | 'updatedAt'>) => {
      setSaveStatus('saving');
      try {
        const newItem = await dbAddItem(itemData);
        setItems((prev) => [...prev, newItem]);
        scheduleSave();
        return newItem;
      } catch (err) {
        console.error('Failed to add item:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [scheduleSave]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<ArtItem>) => {
      const existingItem = items.find((i) => i.id === id);
      if (!existingItem) return;

      setSaveStatus('saving');
      try {
        const updatedItem = await dbUpdateItem({ ...existingItem, ...updates });
        setItems((prev) => prev.map((i) => (i.id === id ? updatedItem : i)));
        scheduleSave();
        return updatedItem;
      } catch (err) {
        console.error('Failed to update item:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [items, scheduleSave]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setSaveStatus('saving');
      try {
        // Clean up connections in other items first
        const itemsWithConnections = items.filter(
          (i) => i.connections?.includes(id)
        );
        for (const item of itemsWithConnections) {
          const updatedConnections = item.connections!.filter((c) => c !== id);
          await dbUpdateItem({ ...item, connections: updatedConnections });
        }

        // Remove the deleted item from state (connections cleanup reflected)
        setItems((prev) =>
          prev
            .filter((i) => i.id !== id)
            .map((i) =>
              i.connections?.includes(id)
                ? { ...i, connections: i.connections.filter((c) => c !== id) }
                : i
            )
        );

        await dbDeleteItem(id);
        scheduleSave();
      } catch (err) {
        console.error('Failed to delete item:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [items, scheduleSave]
  );

  const cycleStatus = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      const currentIndex = STATUS_CYCLE.indexOf(item.status);
      const newStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

      await updateItem(id, { status: newStatus as StatusKey });
    },
    [items, updateItem]
  );

  const reloadItems = useCallback(async () => {
    const [itemsData, tmData] = await Promise.all([
      getAllItems(),
      getAllTreasureMaps(),
    ]);
    setItems(itemsData);
    setTreasureMaps(tmData);
  }, []);

  const importItems = useCallback(
    async (itemsData: ArtItem[], mode: 'merge' | 'replace') => {
      setSaveStatus('saving');
      try {
        const jsonData = JSON.stringify({
          version: 2,
          lastModified: new Date().toISOString(),
          items: itemsData,
        });
        await importFromJSON(jsonData, mode);
        await reloadItems();
        scheduleSave();
      } catch (err) {
        console.error('Failed to import items:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [reloadItems, scheduleSave]
  );

  // 寻宝图相关操作
  const addTreasureMap = useCallback(
    async (treasureMap: TreasureMap) => {
      setSaveStatus('saving');
      try {
        await saveTreasureMap(treasureMap);
        setTreasureMaps((prev) => [...prev, treasureMap]);
        scheduleSave();
      } catch (err) {
        console.error('Failed to add treasure map:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [scheduleSave]
  );

  const deleteTreasureMapById = useCallback(
    async (id: string) => {
      setSaveStatus('saving');
      try {
        await dbDeleteTreasureMap(id);
        setTreasureMaps((prev) => prev.filter((tm) => tm.id !== id));
        scheduleSave();
      } catch (err) {
        console.error('Failed to delete treasure map:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [scheduleSave]
  );

  const updateTreasureMapItemStatus = useCallback(
    async (
      treasureMapId: string,
      itemId: string,
      exploreStatus: 'explored' | 'unexplored',
      collectionItemId?: string
    ) => {
      try {
        await dbUpdateTreasureMapItem(treasureMapId, itemId, {
          exploreStatus,
          collectionItemId,
        });
        setTreasureMaps((prev) =>
          prev.map((tm) => {
            if (tm.id !== treasureMapId) return tm;
            return {
              ...tm,
              items: tm.items.map((item) => {
                if (item.id !== itemId) return item;
                return {
                  ...item,
                  exploreStatus,
                  collectionItemId,
                };
              }),
            };
          })
        );
      } catch (err) {
        console.error('Failed to update treasure map item:', err);
        throw err;
      }
    },
    []
  );

  // 重置功能
  const resetData = useCallback(
    async (clearItems: boolean, clearTreasureMaps: boolean) => {
      setSaveStatus('saving');
      try {
        if (clearItems) {
          await clearAllItems();
          setItems([]);
        }
        if (clearTreasureMaps) {
          await clearAllTreasureMaps();
          setTreasureMaps([]);
        }
        scheduleSave();
      } catch (err) {
        console.error('Failed to reset data:', err);
        setSaveStatus('local-only');
        setTimeout(() => setSaveStatus('idle'), 3000);
        throw err;
      }
    },
    [scheduleSave]
  );

  return {
    items,
    treasureMaps,
    loading,
    saveStatus,
    addItem,
    updateItem,
    deleteItem,
    cycleStatus,
    reloadItems,
    importItems,
    addTreasureMap,
    deleteTreasureMap: deleteTreasureMapById,
    updateTreasureMapItemStatus,
    resetData,
  };
}
