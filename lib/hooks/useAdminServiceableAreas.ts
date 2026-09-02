'use client';

import { useState, useCallback } from 'react';

export interface ServiceableAreaItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAdminServiceableAreas() {
  const [areas, setAreas] = useState<ServiceableAreaItem[]>([]);
  const [areaName, setAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState<string>('');
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  const [togglingAreaId, setTogglingAreaId] = useState<string | null>(null);
  const [isSubmittingArea, setIsSubmittingArea] = useState(false);
  const [isSubmittingEditArea, setIsSubmittingEditArea] = useState(false);
  const [areaMessage, setAreaMessage] = useState('');

  const loadAreas = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/serviceable-areas');
      const data = await res.json();
      if (data.success) setAreas(data.data);
    } catch (err) {
      console.error('Failed to load serviceable areas:', err);
    }
  }, []);

  async function handleCreateArea(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingArea || !areaName.trim()) return;
    setIsSubmittingArea(true);
    setAreaMessage('');
    try {
      const res = await fetch('/api/admin/serviceable-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: areaName.trim(), isActive: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAreaMessage(`Locality "${data.data.name}" added successfully!`);
        setAreaName('');
        loadAreas();
      } else {
        setAreaMessage(`Error: ${data.error}`);
      }
    } catch {
      setAreaMessage('Error adding serviceable area.');
    } finally {
      setIsSubmittingArea(false);
    }
  }

  function handleStartEditArea(area: ServiceableAreaItem) {
    setEditingAreaId(area.id);
    setEditingAreaName(area.name);
  }

  async function handleSaveEditArea(id: string) {
    if (isSubmittingEditArea || !editingAreaName.trim()) return;
    setIsSubmittingEditArea(true);
    setAreaMessage('');
    try {
      const res = await fetch(`/api/admin/serviceable-areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingAreaName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAreaMessage(`Locality updated to "${data.data.name}"!`);
        setEditingAreaId(null);
        setEditingAreaName('');
        loadAreas();
      } else {
        setAreaMessage(`Error updating locality: ${data.error}`);
      }
    } catch {
      setAreaMessage('Error updating locality.');
    } finally {
      setIsSubmittingEditArea(false);
    }
  }

  async function handleToggleAreaActive(area: ServiceableAreaItem) {
    if (togglingAreaId) return;
    setTogglingAreaId(area.id);
    setAreaMessage('');
    try {
      const res = await fetch(`/api/admin/serviceable-areas/${area.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !area.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setAreaMessage(`Locality "${area.name}" is now ${data.data.isActive ? 'Active' : 'Inactive'}.`);
        loadAreas();
      } else {
        setAreaMessage(`Error toggling status: ${data.error}`);
      }
    } catch {
      setAreaMessage('Error toggling locality status.');
    } finally {
      setTogglingAreaId(null);
    }
  }

  async function handleDeleteArea(area: ServiceableAreaItem) {
    if (deletingAreaId || isSubmittingArea) return;
    if (!confirm(`Are you sure you want to delete locality "${area.name}"?`)) return;

    setDeletingAreaId(area.id);
    setAreaMessage('');
    try {
      const res = await fetch(`/api/admin/serviceable-areas/${area.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAreaMessage(`Locality "${area.name}" deleted.`);
        loadAreas();
      } else {
        setAreaMessage(`Error deleting locality: ${data.error}`);
      }
    } catch {
      setAreaMessage('Error deleting locality.');
    } finally {
      setDeletingAreaId(null);
    }
  }

  return {
    areas,
    areaName,
    setAreaName,
    editingAreaId,
    setEditingAreaId,
    editingAreaName,
    setEditingAreaName,
    deletingAreaId,
    togglingAreaId,
    isSubmittingArea,
    isSubmittingEditArea,
    areaMessage,
    setAreaMessage,
    loadAreas,
    handleCreateArea,
    handleStartEditArea,
    handleSaveEditArea,
    handleToggleAreaActive,
    handleDeleteArea,
  };
}
