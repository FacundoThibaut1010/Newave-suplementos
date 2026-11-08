export interface Rate {
  deliveredType: 'D' | 'S'; // 'D' = Domicilio, 'S' = Sucursal
  productType: 'CP' | 'EP' | 'RETIRO' | string; // 'CP' = Clásico, 'EP' = Expreso, 'RETIRO' = Sucursal Newave
  productName: string;
  price: number;
  deliveryTimeMin: string | number;
  deliveryTimeMax: string | number;
  isFallback?: boolean;
}

export interface ShippingQuoteResponse {
  success: boolean;
  rates: Rate[];
  message?: string;
}

