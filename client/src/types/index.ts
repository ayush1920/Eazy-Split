export interface Person {
    id: string;
    name: string;
    emoji?: string;
    email?: string;
}

export interface Item {
    id: string;
    name: string;
    price: number;
    originalPrice?: number; // For validation if needed
    sourceImageId?: string;
}

export interface ReceiptGroup {
    id: string;
    platform: string;
    date: string;
    items: Item[];
    tax?: number;
    tip?: number; // or service charge
    currency: string;
    _modelUsed?: string;
}

export interface SplitAssignment {
    itemId: string;
    personIds: string[];
    isAll: boolean;
}
