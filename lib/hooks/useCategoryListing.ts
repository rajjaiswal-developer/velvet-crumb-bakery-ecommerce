import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  type: string;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: CategoryData[];
}

export interface FlavorData {
  id: string;
  name: string;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: unknown;
  flavor?: string | { id?: string; name: string } | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  variants: Array<{
    id: string;
    label: string;
    price: number;
    stockQuantity: number;
    reservedQuantity: number;
  }>;
}

export function useCategoryListing() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [flavors, setFlavors] = useState<FlavorData[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const cartHook = useCart();

  const loadCategoryData = useCallback(async () => {
    try {
      const [catRes, flavRes, prodRes] = await Promise.all([
        fetch('/api/categories/public'),
        fetch('/api/flavors/public'),
        fetch('/api/products/public'),
      ]);

      const catData = await catRes.json();
      const flavData = await flavRes.json();
      const prodData = await prodRes.json();

      if (catData.success) {
        setAllCategories(catData.data);
        const found = catData.data.find((c: CategoryData) => c.slug === slug);
        setCategory(found || null);

        if (found && prodData.success) {
          setAllProducts(prodData.data);
          // If subcategory, filter products by categoryId
          if (found.parentId) {
            const subProds = prodData.data.filter((p: ProductData) => p.categoryId === found.id);
            setProducts(subProds);
          }
        }
      }

      if (flavData.success) setFlavors(flavData.data);
    } catch (err) {
      console.error('Error loading category page:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  const isTopLevel = category ? !category.parentId : false;
  const subcategories = category
    ? allCategories.filter((c) => c.parentId === category.id)
    : [];

  let filtered = products;
  if (selectedFlavor) {
    filtered = filtered.filter((p) => {
      const flavorName = typeof p.flavor === 'object' ? p.flavor?.name : p.flavor;
      return flavorName === selectedFlavor;
    });
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => {
      const flavorName = typeof p.flavor === 'object' ? p.flavor?.name : p.flavor;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (flavorName && flavorName.toLowerCase().includes(q))
      );
    });
  }

  // Generate breadcrumb items
  const breadcrumbItems = [];
  if (category) {
    if (category.parent) {
      breadcrumbItems.push({
        label: category.parent.name,
        url: `/categories/${category.parent.slug}`,
      });
    }
    breadcrumbItems.push({
      label: category.name,
      url: `/categories/${category.slug}`,
    });
  }

  return {
    slug,
    category,
    allCategories,
    subcategories,
    products,
    allProducts,
    flavors,
    selectedFlavor,
    setSelectedFlavor,
    searchQuery,
    setSearchQuery,
    filtered,
    isTopLevel,
    breadcrumbItems,
    cart: cartHook.cart,
    isCartOpen: cartHook.isCartOpen,
    setIsCartOpen: cartHook.setIsCartOpen,
    loading: loading || cartHook.loading,
    handleQuickAdd: cartHook.handleQuickAdd,
    handleUpdateQuantity: cartHook.handleUpdateQuantity,
    handleRemoveItem: cartHook.handleRemoveItem,
  };
}

