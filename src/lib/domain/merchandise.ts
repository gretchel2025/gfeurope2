export const merchProductCategories = ['T-Shirts', 'Books', 'Cards', 'Bags', 'Sweatshirt'] as const;

export type MerchProductCategory = (typeof merchProductCategories)[number];

export function isMerchProductCategory(category: string): category is MerchProductCategory {
	return merchProductCategories.includes(category as MerchProductCategory);
}

export const MerchReservationStatus = {
	Reserved: 'RESERVED',
	Cancelled: 'CANCELLED',
	Collected: 'COLLECTED'
} as const;

export type MerchReservationStatus =
	(typeof MerchReservationStatus)[keyof typeof MerchReservationStatus];

export const MerchReservationEmailStatus = {
	Pending: 'PENDING',
	Sent: 'SENT',
	Failed: 'FAILED',
	Skipped: 'SKIPPED',
	Unknown: 'UNKNOWN'
} as const;

export type MerchReservationEmailStatus =
	(typeof MerchReservationEmailStatus)[keyof typeof MerchReservationEmailStatus];

export type MerchProduct = {
	event_id: string;
	product_id: string;
	name: string;
	description: string;
	category: string;
	unit_price: number;
	currency: string;
	stock_count: number;
	sizes: string[];
	colors: string[];
	image_urls: string[];
	is_active: boolean;
	deleted_at?: string;
	created_at?: string;
	updated_at?: string;
};

export type CreateMerchProductInput = {
	event_id: string;
	name: string;
	description: string;
	category: string;
	unit_price: number;
	currency?: string;
	stock_count: number;
	sizes?: string[];
	colors?: string[];
	image_urls?: string[];
	is_active?: boolean;
};

export type UpdateMerchProductInput = Omit<CreateMerchProductInput, 'event_id'> & {
	product_id: string;
};

export type MerchReservationItem = {
	item_id?: string;
	event_id: string;
	reservation_id: string;
	product_id: string;
	product_name: string;
	quantity: number;
	unit_price: number;
	currency: string;
	selected_size?: string;
	selected_color?: string;
};

export type CreateMerchReservationItemInput = {
	product_id: string;
	quantity: number;
	selected_size?: string;
	selected_color?: string;
};

export type CreateMerchReservationInput = {
	event_id: string;
	customer_name: string;
	email: string;
	mobile: string;
	items: CreateMerchReservationItemInput[];
};

export type MerchReservation = {
	event_id: string;
	reservation_id: string;
	customer_name: string;
	email: string;
	mobile: string;
	reserved_at: string;
	status: MerchReservationStatus;
	amount_total: number;
	currency: string;
	confirmation_email_status: MerchReservationEmailStatus;
	confirmation_email_attempted_at?: string;
	confirmation_email_provider_id?: string;
	confirmation_email_error?: string;
	items: MerchReservationItem[];
	created_at?: string;
	updated_at?: string;
};

export function sortMerchProductsByCategoryAndName(products: MerchProduct[]): MerchProduct[] {
	return [...products].sort((left, right) => {
		const categoryCompare =
			merchCategorySortOrder(left.category) - merchCategorySortOrder(right.category);
		if (categoryCompare !== 0) return categoryCompare;
		return left.name.localeCompare(right.name);
	});
}

export function groupMerchProductsByCategory(products: MerchProduct[]): {
	category: string;
	products: MerchProduct[];
}[] {
	const grouped = new Map<string, MerchProduct[]>();
	for (const product of sortMerchProductsByCategoryAndName(products)) {
		grouped.set(product.category, [...(grouped.get(product.category) ?? []), product]);
	}

	return Array.from(grouped.entries()).map(([category, categoryProducts]) => ({
		category,
		products: categoryProducts
	}));
}

function merchCategorySortOrder(category: string): number {
	const index = merchProductCategories.findIndex((productCategory) => productCategory === category);
	return index === -1 ? merchProductCategories.length : index;
}
