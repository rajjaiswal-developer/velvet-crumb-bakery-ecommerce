'use client';

import { useState, useCallback } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type: 'CAKE' | 'CELEBRATION';
  parentId?: string | null;
  parent?: CategoryItem | null;
  children?: CategoryItem[];
}

export function useAdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catType, setCatType] = useState<'CAKE' | 'CELEBRATION'>('CAKE');
  const [catParentId, setCatParentId] = useState<string>('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [catMessage, setCatMessage] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingCat) return;
    setIsSubmittingCat(true);
    setCatMessage('');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          type: catType,
          parentId: catParentId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCatMessage(`Category "${data.data.name}" created!`);
        setCatName('');
        setCatSlug('');
        setCatParentId('');
        loadCategories();
      } else {
        setCatMessage(`Error: ${data.error}`);
      }
    } catch {
      setCatMessage('Error creating category.');
    } finally {
      setIsSubmittingCat(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (deletingCatId || isSubmittingCat) return;
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setDeletingCatId(id);
    setCatMessage('');
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCatMessage(`Category "${name}" deleted.`);
        loadCategories();
      } else {
        setCatMessage(`Error deleting category: ${data.error}`);
      }
    } catch {
      setCatMessage('Error deleting category.');
    } finally {
      setDeletingCatId(null);
    }
  }

  return {
    categories,
    catName,
    setCatName,
    catSlug,
    setCatSlug,
    catType,
    setCatType,
    catParentId,
    setCatParentId,
    isSubmittingCat,
    deletingCatId,
    catMessage,
    setCatMessage,
    loadCategories,
    handleCreateCategory,
    handleDeleteCategory,
  };
}
