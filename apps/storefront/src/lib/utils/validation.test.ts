import { describe, it, expect } from 'vitest';
import {
	emailSchema,
	passwordSchema,
	loginSchema,
	registerSchema,
	addToCartSchema,
	updateCartSchema,
	addressSchema,
	contactSchema,
	profileSchema
} from './validation';

describe('emailSchema', () => {
	it('accepts valid emails', () => {
		expect(emailSchema.safeParse('user@example.com').success).toBe(true);
		expect(emailSchema.safeParse('test+tag@domain.co.uk').success).toBe(true);
	});

	it('rejects invalid emails', () => {
		expect(emailSchema.safeParse('').success).toBe(false);
		expect(emailSchema.safeParse('not-an-email').success).toBe(false);
		expect(emailSchema.safeParse('@missing.local').success).toBe(false);
	});
});

describe('passwordSchema', () => {
	it('accepts passwords with 8-128 characters', () => {
		expect(passwordSchema.safeParse('a'.repeat(8)).success).toBe(true);
		expect(passwordSchema.safeParse('a'.repeat(128)).success).toBe(true);
	});

	it('rejects passwords that are too short', () => {
		const result = passwordSchema.safeParse('short');
		expect(result.success).toBe(false);
	});

	it('rejects passwords that are too long', () => {
		const result = passwordSchema.safeParse('a'.repeat(129));
		expect(result.success).toBe(false);
	});
});

describe('loginSchema', () => {
	it('accepts valid login data', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: 'test' });
		expect(result.success).toBe(true);
	});

	it('rejects empty password', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid email', () => {
		const result = loginSchema.safeParse({ email: 'bad', password: 'password123' });
		expect(result.success).toBe(false);
	});
});

describe('registerSchema', () => {
	it('accepts valid registration data', () => {
		const result = registerSchema.safeParse({
			email: 'user@example.com',
			password: 'password123'
		});
		expect(result.success).toBe(true);
	});

	it('accepts registration with optional name fields', () => {
		const result = registerSchema.safeParse({
			email: 'user@example.com',
			password: 'password123',
			first_name: 'John',
			last_name: 'Doe'
		});
		expect(result.success).toBe(true);
	});

	it('enforces password length on registration', () => {
		const result = registerSchema.safeParse({
			email: 'user@example.com',
			password: 'short'
		});
		expect(result.success).toBe(false);
	});
});

describe('addToCartSchema', () => {
	it('accepts valid cart item', () => {
		const result = addToCartSchema.safeParse({ variantId: 'var_123', quantity: 2 });
		expect(result.success).toBe(true);
	});

	it('defaults quantity to 1', () => {
		const result = addToCartSchema.safeParse({ variantId: 'var_123' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.quantity).toBe(1);
		}
	});

	it('rejects quantity above 99', () => {
		const result = addToCartSchema.safeParse({ variantId: 'var_123', quantity: 100 });
		expect(result.success).toBe(false);
	});

	it('rejects quantity below 1', () => {
		const result = addToCartSchema.safeParse({ variantId: 'var_123', quantity: 0 });
		expect(result.success).toBe(false);
	});

	it('rejects empty variantId', () => {
		const result = addToCartSchema.safeParse({ variantId: '', quantity: 1 });
		expect(result.success).toBe(false);
	});
});

describe('updateCartSchema', () => {
	it('accepts quantity of 0 (remove item)', () => {
		const result = updateCartSchema.safeParse({ lineItemId: 'li_123', quantity: 0 });
		expect(result.success).toBe(true);
	});

	it('rejects quantity above 99', () => {
		const result = updateCartSchema.safeParse({ lineItemId: 'li_123', quantity: 100 });
		expect(result.success).toBe(false);
	});
});

describe('addressSchema', () => {
	const validAddress = {
		first_name: 'John',
		last_name: 'Doe',
		address_1: '123 Main St',
		city: 'Springfield',
		postal_code: '12345',
		country_code: 'US'
	};

	it('accepts a valid address', () => {
		expect(addressSchema.safeParse(validAddress).success).toBe(true);
	});

	it('accepts address with optional fields', () => {
		const result = addressSchema.safeParse({
			...validAddress,
			address_2: 'Apt 4B',
			province: 'IL',
			phone: '+1234567890'
		});
		expect(result.success).toBe(true);
	});

	it('rejects country_code that is not 2 characters', () => {
		expect(addressSchema.safeParse({ ...validAddress, country_code: 'USA' }).success).toBe(false);
		expect(addressSchema.safeParse({ ...validAddress, country_code: 'U' }).success).toBe(false);
	});

	it('rejects missing required fields', () => {
		const { first_name, ...noFirstName } = validAddress;
		expect(addressSchema.safeParse(noFirstName).success).toBe(false);
	});
});

describe('contactSchema', () => {
	it('accepts valid contact data', () => {
		const result = contactSchema.safeParse({
			name: 'Jane',
			email: 'jane@example.com',
			message: 'Hello!'
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty message', () => {
		const result = contactSchema.safeParse({
			name: 'Jane',
			email: 'jane@example.com',
			message: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects message exceeding 5000 characters', () => {
		const result = contactSchema.safeParse({
			name: 'Jane',
			email: 'jane@example.com',
			message: 'a'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});
});

describe('profileSchema', () => {
	it('accepts empty profile (all optional)', () => {
		expect(profileSchema.safeParse({}).success).toBe(true);
	});

	it('accepts partial profile data', () => {
		const result = profileSchema.safeParse({ first_name: 'John' });
		expect(result.success).toBe(true);
	});

	it('rejects first_name exceeding 100 characters', () => {
		const result = profileSchema.safeParse({ first_name: 'a'.repeat(101) });
		expect(result.success).toBe(false);
	});
});
