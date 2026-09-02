import { NextRequest, NextResponse } from 'next/server';
import { getCart, addToCart, updateCartItem, removeFromCart } from '@/lib/cart/cart';
import {
  cartItemAddSchema,
  cartItemUpdateSchema,
  cartItemRemoveSchema,
} from '@/lib/validation/schemas';

export async function GET() {
  try {
    const cart = await getCart();
    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = cartItemAddSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { variantId, quantity } = validation.data;
    const cart = await addToCart(variantId, quantity);

    return NextResponse.json({ success: true, data: cart });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add item to cart';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = cartItemUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { variantId, quantity } = validation.data;
    const cart = await updateCartItem(variantId, quantity);

    return NextResponse.json({ success: true, data: cart });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update cart item';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = cartItemRemoveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { variantId } = validation.data;
    const cart = await removeFromCart(variantId);

    return NextResponse.json({ success: true, data: cart });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove item from cart';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
