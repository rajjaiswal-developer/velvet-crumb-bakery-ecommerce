'use client';

import { useState, useCallback } from 'react';
import { ProductItem } from './useAdminProducts';

export interface FlavorItem {
  id: string;
  name: string;
  _count?: { products: number };
}

export function useAdminFlavors(onFlavorsChanged?: () => void) {
  const [flavors, setFlavors] = useState<FlavorItem[]>([]);
  const [flavorName, setFlavorName] = useState('');
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);
  const [editingFlavorName, setEditingFlavorName] = useState<string>('');
  const [deletingFlavorId, setDeletingFlavorId] = useState<string | null>(null);
  const [isSubmittingFlavor, setIsSubmittingFlavor] = useState(false);
  const [isSubmittingEditFlavor, setIsSubmittingEditFlavor] = useState(false);
  const [flavorMessage, setFlavorMessage] = useState('');

  const loadFlavors = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/flavors');
      const data = await res.json();
      if (data.success) setFlavors(data.data);
    } catch (err) {
      console.error('Failed to load flavors:', err);
    }
  }, []);

  async function handleCreateFlavor(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingFlavor) return;
    setIsSubmittingFlavor(true);
    setFlavorMessage('');
    try {
      const res = await fetch('/api/admin/flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: flavorName }),
      });
      const data = await res.json();
      if (data.success) {
        setFlavorMessage(`Flavor "${data.data.name}" created!`);
        setFlavorName('');
        loadFlavors();
        if (onFlavorsChanged) onFlavorsChanged();
      } else {
        setFlavorMessage(`Error: ${data.error}`);
      }
    } catch {
      setFlavorMessage('Error creating flavor.');
    } finally {
      setIsSubmittingFlavor(false);
    }
  }

  function handleStartEditFlavor(f: FlavorItem) {
    setEditingFlavorId(f.id);
    setEditingFlavorName(f.name);
  }

  async function handleSaveEditFlavor(id: string) {
    if (isSubmittingEditFlavor || !editingFlavorName.trim()) return;
    setIsSubmittingEditFlavor(true);
    setFlavorMessage('');
    try {
      const res = await fetch(`/api/admin/flavors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingFlavorName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFlavorMessage(`Flavor updated to "${data.data.name}"!`);
        setEditingFlavorId(null);
        setEditingFlavorName('');
        loadFlavors();
        if (onFlavorsChanged) onFlavorsChanged();
      } else {
        setFlavorMessage(`Error updating flavor: ${data.error}`);
      }
    } catch {
      setFlavorMessage('Error updating flavor.');
    } finally {
      setIsSubmittingEditFlavor(false);
    }
  }

  async function handleDeleteFlavor(f: FlavorItem, currentProducts: ProductItem[] = []) {
    if (deletingFlavorId || isSubmittingFlavor || isSubmittingEditFlavor) return;
    const usageCount = f._count?.products ?? currentProducts.filter((p) => p.flavorId === f.id || p.flavor?.id === f.id).length;

    const confirmMessage = usageCount > 0
      ? `This flavor is currently used by ${usageCount} product(s). Deleting it will remove the flavor tag from those products. Continue?`
      : `Are you sure you want to delete flavor "${f.name}"?`;

    if (!confirm(confirmMessage)) return;

    setDeletingFlavorId(f.id);
    setFlavorMessage('');
    try {
      const res = await fetch(`/api/admin/flavors/${f.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFlavorMessage(`Flavor "${f.name}" deleted.`);
        loadFlavors();
        if (onFlavorsChanged) onFlavorsChanged();
      } else {
        setFlavorMessage(`Error deleting flavor: ${data.error}`);
      }
    } catch {
      setFlavorMessage('Error deleting flavor.');
    } finally {
      setDeletingFlavorId(null);
    }
  }

  return {
    flavors,
    flavorName,
    setFlavorName,
    editingFlavorId,
    setEditingFlavorId,
    editingFlavorName,
    setEditingFlavorName,
    deletingFlavorId,
    isSubmittingFlavor,
    isSubmittingEditFlavor,
    flavorMessage,
    setFlavorMessage,
    loadFlavors,
    handleCreateFlavor,
    handleStartEditFlavor,
    handleSaveEditFlavor,
    handleDeleteFlavor,
  };
}
