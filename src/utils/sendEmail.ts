import { supabase } from '@/integrations/supabase/client';

export type EmailTemplate = 
  | 'order_confirmed'
  | 'payment_approved' 
  | 'shipping_label'
  | 'order_delivered'
  | 'review_approved'
  | 'stock_alert_admin'
  | 'nfe_generated';

export interface EmailData {
  order_confirmed: {
    orderNumber: string;
    customerName: string;
    items: Array<{
      name: string;
      brand: string;
      quantity: number;
      size: string;
      price: number;
    }>;
    total: number;
    shippingAddress: any;
  };
  payment_approved: {
    orderNumber: string;
    customerName: string;
    total: number;
    paymentMethod: string;
  };
  shipping_label: {
    orderNumber: string;
    customerName: string;
    trackingCode: string;
    shippingService: string;
    estimatedDays: number;
  };
  order_delivered: {
    orderNumber: string;
    customerName: string;
    trackingCode: string;
  };
  review_approved: {
    customerName: string;
    perfumeName: string;
    perfumeBrand: string;
    pointsEarned: number;
  };
  stock_alert_admin: {
    perfumeName: string;
    perfumeBrand: string;
    remainingStock: number;
    warehouseName: string;
  };
  nfe_generated: {
    customerName: string;
    orderNumber: string;
    nfeNumber: number;
    nfeKey: string;
    pdfUrl: string;
  };
}

export async function sendEmail<T extends EmailTemplate>(
  to: string,
  template: T,
  data: EmailData[T]
) {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        template,
        data
      }
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}