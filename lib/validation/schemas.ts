import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  slug: z.string().trim().min(1, 'Slug is required'),
  type: z.enum(['CAKE', 'CELEBRATION']),
  parentId: z.string().optional().nullable(),
});

export const categoryUpdateSchema = categorySchema.partial();

export const flavorSchema = z.object({
  name: z.string().trim().min(1, 'Flavor name is required'),
});

export const flavorUpdateSchema = flavorSchema.partial();

export const serviceableAreaSchema = z.object({
  name: z.string().trim().min(1, 'Locality name is required').max(100, 'Locality name must not exceed 100 characters'),
  isActive: z.boolean().optional().default(true),
});

export const serviceableAreaUpdateSchema = serviceableAreaSchema.partial();

export const imageItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().optional(),
});

export const variantInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, 'Variant label is required (e.g. 1kg)'),
  price: z.number().min(0, 'Price must be non-negative'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be >= 0'),
  reservedQuantity: z.number().int().min(0, 'Reserved quantity must be >= 0').optional().default(0),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  slug: z.string().trim().min(1, 'Slug is required'),
  categoryId: z.string().trim().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  images: z.array(imageItemSchema).optional().default([]),
  flavorId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  seoTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  variants: z.array(variantInputSchema).min(1, 'At least one variant is required'),
});

export const productUpdateSchema = productSchema.partial().extend({
  isDeleted: z.boolean().optional(),
});

// Cart validation schemas
export const cartItemAddSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const cartItemUpdateSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export const cartItemRemoveSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
});

// Checkout input validation schema
export const checkoutInputSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters'),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val === '' || !val ? null : val)),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must be 10 digits starting 6-9)'),
    confirmPhone: z.string(),
    alternatePhone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Invalid alternate Indian mobile number (must be 10 digits starting 6-9)')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val === '' || !val ? null : val)),
    flatBuilding: z
      .string()
      .trim()
      .min(1, 'Flat / House No. & Building Name is required')
      .max(150, 'Flat/Building must not exceed 150 characters')
      .optional(),
    street: z
      .string()
      .trim()
      .min(1, 'Street / Road Name is required')
      .max(150, 'Street/Road must not exceed 150 characters')
      .optional(),
    landmark: z
      .string()
      .trim()
      .max(150, 'Landmark must not exceed 150 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val === '' || !val ? null : val)),
    area: z
      .string()
      .trim()
      .min(1, 'Serviceable Area is required')
      .optional(),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian PIN code (e.g. 400077)')
      .optional(),
    address: z
      .string()
      .min(5, 'Delivery address must be at least 5 characters')
      .max(500, 'Delivery address must not exceed 500 characters')
      .optional(),
    deliveryTimeSlot: z.enum(['1-hour', '2-hours', '3-hours', '4-hours']),
    specialInstructions: z
      .string()
      .max(500, 'Special instructions must not exceed 500 characters')
      .optional()
      .nullable(),
  })
  .refine((data) => data.phone === data.confirmPhone, {
    message: 'Mobile numbers do not match',
    path: ['confirmPhone'],
  })
  .refine((data) => {
    // Require either complete structured address fields or a pre-combined address string
    if (data.flatBuilding && data.street && data.area && data.pincode) return true;
    if (data.address && data.address.trim().length >= 5) return true;
    return false;
  }, {
    message: 'Please complete all required address fields (Building, Street, Area, PIN Code)',
    path: ['address'],
  });

