export interface Product {
  _id?: string;
  id?: string | number;
  name: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  tagline: string;
}
