'use client';

import { useState, useCallback } from 'react';
import { CategoryItem } from './useAdminCategories';
import { FlavorItem } from './useAdminFlavors';

export interface VariantItem {
  id?: string;
  label: string;
  price: number | string;
  stockQuantity: number | string;
  reservedQuantity?: number;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  flavorId?: string | null;
  flavor?: FlavorItem | null;
  images?: string[] | unknown;
  categoryId?: string;
  isFeatured?: boolean;
  isDeleted?: boolean;
  category?: CategoryItem;
  variants?: VariantItem[];
}

export function useAdminProducts() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [prodSearchQuery, setProdSearchQuery] = useState<string>('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodFlavor, setProdFlavor] = useState('');
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodImages, setProdImages] = useState<Array<{ url: string; fileId?: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formVariants, setFormVariants] = useState<
    Array<{ id?: string; label: string; price: string; stockQuantity: string; reservedQuantity?: number }>
  >([{ label: '500g', price: '500', stockQuantity: '10' }]);

  const [isSubmittingProd, setIsSubmittingProd] = useState(false);
  const [deletingProdId, setDeletingProdId] = useState<string | null>(null);
  const [permanentDeletingProdId, setPermanentDeletingProdId] = useState<string | null>(null);
  const [checkingOrderRefsProdId, setCheckingOrderRefsProdId] = useState<string | null>(null);
  const [prodMessage, setProdMessage] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products?includeDeleted=true');
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || uploadingImage || isSubmittingProd) return;

    setUploadingImage(true);
    setProdMessage('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setProdMessage(`Error: File "${file.name}" exceeds 5MB maximum size limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.data?.url) {
          setProdImages((prev) => [
            ...prev,
            { url: data.data.url, fileId: data.data.fileId || undefined },
          ]);
          setProdMessage(`Image "${file.name}" uploaded successfully!`);
        } else {
          setProdMessage(`Error uploading "${file.name}": ${data.error}`);
        }
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setProdMessage('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  }

  function handleRemoveImage(index: number) {
    setProdImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddVariantRow() {
    setFormVariants((prev) => [...prev, { label: '', price: '', stockQuantity: '' }]);
  }

  function handleRemoveVariantRow(index: number) {
    if (formVariants.length <= 1) {
      alert('Product must have at least one variant.');
      return;
    }

    const targetVariant = formVariants[index];
    if (targetVariant.reservedQuantity && targetVariant.reservedQuantity > 0) {
      alert(
        `Cannot remove variant "${targetVariant.label}" because it has ${targetVariant.reservedQuantity} active order reservation(s).`
      );
      return;
    }

    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVariantChange(
    index: number,
    field: 'label' | 'price' | 'stockQuantity',
    value: string
  ) {
    setFormVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProdName('');
    setProdSlug('');
    setProdCatId('');
    setProdDesc('');
    setProdFlavor('');
    setProdIsFeatured(false);
    setProdImages([]);
    setFormVariants([{ label: '500g', price: '500', stockQuantity: '10' }]);
  }

  function handleEditProduct(p: ProductItem) {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdSlug(p.slug);
    setProdCatId(p.categoryId || p.category?.id || '');
    setProdDesc(p.description || '');
    setProdFlavor(p.flavorId || p.flavor?.id || '');
    setProdIsFeatured(p.isFeatured || false);

    let rawImgs: Array<{ url: string; fileId?: string }> = [];
    if (Array.isArray(p.images)) {
      rawImgs = p.images
        .map((img: unknown) => {
          if (typeof img === 'string') {
            return { url: img };
          }
          if (
            img &&
            typeof img === 'object' &&
            'url' in img &&
            typeof (img as { url: unknown }).url === 'string'
          ) {
            return {
              url: (img as { url: string }).url,
              fileId: (img as { fileId?: string }).fileId || undefined,
            };
          }
          return null;
        })
        .filter((item): item is { url: string; fileId?: string } => item !== null && !!item.url);
    }
    setProdImages(rawImgs);

    if (p.variants && p.variants.length > 0) {
      setFormVariants(
        p.variants.map((v) => ({
          id: v.id,
          label: v.label,
          price: v.price.toString(),
          stockQuantity: v.stockQuantity.toString(),
          reservedQuantity: v.reservedQuantity || 0,
        }))
      );
    } else {
      setFormVariants([{ label: '500g', price: '500', stockQuantity: '10' }]);
    }

    setProdMessage(`Editing product "${p.name}". Scroll up to product form.`);
  }

  async function handleDeleteProduct(p: ProductItem) {
    if (deletingProdId || isSubmittingProd) return;
    if (!confirm(`Are you sure you want to soft-delete product "${p.name}"?`)) return;

    setDeletingProdId(p.id);
    setProdMessage('');
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProdMessage(`Product "${p.name}" deleted.`);
        loadProducts();
      } else {
        setProdMessage(`Error deleting product: ${data.error}`);
      }
    } catch {
      setProdMessage('Error deleting product.');
    } finally {
      setDeletingProdId(null);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingProd || uploadingImage || deletingProdId) return;
    setIsSubmittingProd(true);
    setProdMessage('');

    try {
      if (formVariants.length === 0) {
        setProdMessage('Error: Product must have at least one variant.');
        setIsSubmittingProd(false);
        return;
      }

      for (const v of formVariants) {
        if (!v.label.trim()) {
          setProdMessage('Error: Variant label cannot be empty.');
          setIsSubmittingProd(false);
          return;
        }
        const price = parseFloat(v.price);
        const stock = parseInt(v.stockQuantity, 10);
        if (isNaN(price) || price < 0) {
          setProdMessage(`Error: Invalid price for variant "${v.label}".`);
          setIsSubmittingProd(false);
          return;
        }
        if (isNaN(stock) || stock < 0) {
          setProdMessage(`Error: Invalid stock quantity for variant "${v.label}".`);
          setIsSubmittingProd(false);
          return;
        }
        if (v.reservedQuantity && stock < v.reservedQuantity) {
          setProdMessage(
            `Error: Cannot set stock (${stock}) below reserved quantity (${v.reservedQuantity}) for variant "${v.label}".`
          );
          setIsSubmittingProd(false);
          return;
        }
      }

      const payload = {
        name: prodName.trim(),
        slug: prodSlug.trim(),
        categoryId: prodCatId.trim(),
        description: prodDesc,
        flavorId: prodFlavor || null,
        isFeatured: prodIsFeatured,
        images: prodImages,
        variants: formVariants.map((v) => ({
          id: v.id,
          label: v.label.trim(),
          price: parseFloat(v.price),
          stockQuantity: parseInt(v.stockQuantity, 10),
          reservedQuantity: v.reservedQuantity || 0,
        })),
      };

      const isEdit = !!editingProductId;
      const url = isEdit ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setProdMessage(`Product "${data.data.name}" ${isEdit ? 'updated' : 'created'} successfully!`);
        resetProductForm();
        loadProducts();
      } else {
        setProdMessage(`Error: ${data.error}`);
      }
    } catch {
      setProdMessage('Error saving product.');
    } finally {
      setIsSubmittingProd(false);
    }
  }

  async function handlePermanentDeleteProduct(p: ProductItem) {
    if (permanentDeletingProdId || checkingOrderRefsProdId || isSubmittingProd) return;

    // Step 1: Check order references first
    setCheckingOrderRefsProdId(p.id);
    setProdMessage('');
    try {
      const checkRes = await fetch(`/api/admin/products/${p.id}/check-order-refs`);
      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.success) {
        setProdMessage(`Error checking order references: ${checkData.error || 'Unknown error'}`);
        setCheckingOrderRefsProdId(null);
        return;
      }

      if (checkData.data.hasOrderReferences) {
        setProdMessage(
          `Cannot permanently delete "${p.name}": This product was part of ${checkData.data.orderCount} real customer order(s) and cannot be permanently deleted, to preserve order history accuracy.`
        );
        setCheckingOrderRefsProdId(null);
        return;
      }

      setCheckingOrderRefsProdId(null);

      // Step 2: Confirmation dialog (only shown after order-ref check passes)
      if (
        !confirm(
          `⚠️ PERMANENT DELETE\n\nThis will permanently and irreversibly delete the product "${p.name}" and all its variants from the database.\n\nThis cannot be undone. Continue?`
        )
      ) {
        return;
      }

      // Step 3: Execute permanent delete
      setPermanentDeletingProdId(p.id);
      const deleteRes = await fetch(`/api/admin/products/${p.id}/permanent`, { method: 'DELETE' });
      const deleteData = await deleteRes.json();

      if (deleteData.success) {
        setProdMessage(`Product "${p.name}" has been permanently and irreversibly deleted.`);
        loadProducts();
      } else {
        setProdMessage(`Error: ${deleteData.error}`);
      }
    } catch {
      setProdMessage('Error during permanent deletion process.');
    } finally {
      setCheckingOrderRefsProdId(null);
      setPermanentDeletingProdId(null);
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = prodSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesCategory =
      !prodCategoryFilter ||
      p.categoryId === prodCategoryFilter ||
      p.category?.id === prodCategoryFilter ||
      p.category?.parentId === prodCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return {
    products,
    prodSearchQuery,
    setProdSearchQuery,
    prodCategoryFilter,
    setProdCategoryFilter,
    editingProductId,
    prodName,
    setProdName,
    prodSlug,
    setProdSlug,
    prodCatId,
    setProdCatId,
    prodDesc,
    setProdDesc,
    prodFlavor,
    setProdFlavor,
    prodIsFeatured,
    setProdIsFeatured,
    prodImages,
    setProdImages,
    uploadingImage,
    formVariants,
    setFormVariants,
    isSubmittingProd,
    deletingProdId,
    permanentDeletingProdId,
    checkingOrderRefsProdId,
    prodMessage,
    setProdMessage,
    filteredProducts,
    loadProducts,
    handleImageUpload,
    handleRemoveImage,
    handleAddVariantRow,
    handleRemoveVariantRow,
    handleVariantChange,
    resetProductForm,
    handleEditProduct,
    handleDeleteProduct,
    handlePermanentDeleteProduct,
    handleSaveProduct,
  };
}
