import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '../db/client';
import { getFirstProductImage } from '../imagekit-url';

const getCartSecretKey = () => {
  const secret = process.env.CART_SESSION_SECRET;
  if (!secret) {
    throw new Error('[FATAL SECURITY ERROR]: CART_SESSION_SECRET is not configured in environment variables.');
  }
  return new TextEncoder().encode(secret);
};
const CART_SECRET_KEY = getCartSecretKey();

const COOKIE_NAME = 'cart_session';

export interface RawCartItem {
  variantId: string;
  quantity: number;
}

export interface ResolvedCartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  variantLabel: string;
  price: number;
  quantity: number;
  availableStock: number;
  isAvailable: boolean;
  itemTotal: number;
}

export interface CartResponse {
  items: ResolvedCartItem[];
  totalAmount: number;
  itemCount: number;
}

async function getRawCartItems(): Promise<RawCartItem[]> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return [];

  try {
    const { payload } = await jwtVerify(token, CART_SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return (payload.items as RawCartItem[]) || [];
  } catch {
    return [];
  }
}

async function saveCartItems(items: RawCartItem[]) {
  const token = await new SignJWT({ items })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(CART_SECRET_KEY);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function getCart(): Promise<CartResponse> {
  const rawItems = await getRawCartItems();
  if (rawItems.length === 0) {
    return { items: [], totalAmount: 0, itemCount: 0 };
  }

  const variantIds = rawItems.map((item) => item.variantId);
  const variants = await db.variant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: true,
    },
  });

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const resolvedItems: ResolvedCartItem[] = [];
  let totalAmount = 0;
  let itemCount = 0;

  for (const raw of rawItems) {
    const variant = variantMap.get(raw.variantId);

    if (
      !variant ||
      !variant.product ||
      variant.product.isDeleted ||
      !variant.product.isActive
    ) {
      continue;
    }

    const availableStock = Math.max(0, variant.stockQuantity - variant.reservedQuantity);
    const isAvailable = availableStock > 0;
    const clampedQuantity = isAvailable ? Math.min(raw.quantity, availableStock) : 0;
    const price = Number(variant.price);
    const itemTotal = price * clampedQuantity;

    const image = getFirstProductImage(variant.product.images);

    if (clampedQuantity > 0 || !isAvailable) {
      resolvedItems.push({
        variantId: variant.id,
        productId: variant.product.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        productImage: image,
        variantLabel: variant.label,
        price,
        quantity: clampedQuantity,
        availableStock,
        isAvailable,
        itemTotal,
      });

      if (isAvailable) {
        totalAmount += itemTotal;
        itemCount += clampedQuantity;
      }
    }
  }

  return { items: resolvedItems, totalAmount, itemCount };
}

export async function addToCart(variantId: string, quantity: number): Promise<CartResponse> {
  const variant = await db.variant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (
    !variant ||
    !variant.product ||
    variant.product.isDeleted ||
    !variant.product.isActive
  ) {
    throw new Error('Product variant not available');
  }

  const availableStock = variant.stockQuantity - variant.reservedQuantity;
  if (availableStock <= 0) {
    throw new Error('This item is currently out of stock');
  }

  const rawItems = await getRawCartItems();
  const existingIndex = rawItems.findIndex((item) => item.variantId === variantId);
  const currentQty = existingIndex >= 0 ? rawItems[existingIndex].quantity : 0;
  const newQty = currentQty + quantity;

  if (newQty > availableStock) {
    throw new Error(`Cannot add more than available stock (${availableStock})`);
  }

  if (existingIndex >= 0) {
    rawItems[existingIndex].quantity = newQty;
  } else {
    rawItems.push({ variantId, quantity: newQty });
  }

  await saveCartItems(rawItems);
  return getCart();
}

export async function updateCartItem(
  variantId: string,
  quantity: number
): Promise<CartResponse> {
  const rawItems = await getRawCartItems();
  const existingIndex = rawItems.findIndex((item) => item.variantId === variantId);

  if (existingIndex < 0) {
    return getCart();
  }

  if (quantity <= 0) {
    rawItems.splice(existingIndex, 1);
    await saveCartItems(rawItems);
    return getCart();
  }

  const variant = await db.variant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    rawItems.splice(existingIndex, 1);
    await saveCartItems(rawItems);
    return getCart();
  }

  const availableStock = variant.stockQuantity - variant.reservedQuantity;
  if (quantity > availableStock) {
    throw new Error(`Requested quantity exceeds available stock (${availableStock})`);
  }

  rawItems[existingIndex].quantity = quantity;
  await saveCartItems(rawItems);
  return getCart();
}

export async function removeFromCart(variantId: string): Promise<CartResponse> {
  const rawItems = await getRawCartItems();
  const updatedItems = rawItems.filter((item) => item.variantId !== variantId);
  await saveCartItems(updatedItems);
  return getCart();
}
