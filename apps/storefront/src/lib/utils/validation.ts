import { z } from 'zod';

// --- Primitive schemas ---

export const emailSchema = z.email('Invalid email address');

export const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.max(128, 'Password must be at most 128 characters');

// --- Auth schemas ---

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	first_name: z.string().max(100).optional(),
	last_name: z.string().max(100).optional()
});

// --- Cart schemas ---

export const addToCartSchema = z.object({
	variantId: z.string().min(1, 'Variant ID is required'),
	quantity: z.coerce.number().int().min(1).max(99).default(1)
});

export const updateCartSchema = z.object({
	lineItemId: z.string().min(1, 'Line item ID is required'),
	quantity: z.coerce.number().int().min(0).max(99)
});

// --- Address schema ---

export const addressSchema = z.object({
	first_name: z.string().min(1, 'First name is required').max(100),
	last_name: z.string().min(1, 'Last name is required').max(100),
	address_1: z.string().min(1, 'Address is required').max(200),
	address_2: z.string().max(200).optional(),
	city: z.string().min(1, 'City is required').max(100),
	province: z.string().max(100).optional(),
	postal_code: z.string().min(1, 'Postal code is required').max(20),
	country_code: z.string().length(2, 'Country code must be 2 characters'),
	phone: z.string().max(20).optional()
});

export const shippingAddressSchema = z.object({
	email: emailSchema,
	address: addressSchema
});

// --- Contact schema ---

export const contactSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	email: emailSchema,
	message: z.string().min(1, 'Message is required').max(5000)
});
