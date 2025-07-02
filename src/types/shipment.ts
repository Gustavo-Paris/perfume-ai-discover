
export interface Shipment {
  id: string;
  order_id: string;
  melhor_envio_cart_id?: string;
  melhor_envio_shipment_id?: string;
  tracking_code?: string;
  pdf_url?: string;
  status: 'pending' | 'cart_added' | 'purchased' | 'label_printed' | 'shipped' | 'delivered';
  service_name?: string;
  service_price?: number;
  estimated_delivery_days?: number;
  created_at: string;
  updated_at: string;
}

export interface MelhorEnvioQuote {
  service: string;
  company: string;
  price: number;
  deadline: number;
  service_id: number;
  company_id: number;
}

export interface BuyLabelRequest {
  orderId: string;
}

export interface BuyLabelResponse {
  success: boolean;
  shipment: Shipment;
  melhor_envio_data: {
    cart_id: string;
    tracking_code: string;
    pdf_url?: string;
  };
}
