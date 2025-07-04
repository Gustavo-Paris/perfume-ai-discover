// Google Analytics 4 utilities
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

export const initGA4 = (measurementId: string) => {
  // Load GA4 script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// E-commerce Events for GA4
export const trackAddToCart = (item: {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_variant: string;
  price: number;
  quantity: number;
}) => {
  trackEvent('add_to_cart', {
    currency: 'BRL',
    value: item.price * item.quantity,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      item_brand: item.item_brand,
      item_variant: item.item_variant,
      price: item.price,
      quantity: item.quantity
    }]
  });
};

export const trackBeginCheckout = (items: Array<{
  item_id: string;
  item_name: string;
  item_brand: string;
  item_variant: string;
  price: number;
  quantity: number;
}>) => {
  const value = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  trackEvent('begin_checkout', {
    currency: 'BRL',
    value,
    items
  });
};

export const trackPurchase = (transaction: {
  transaction_id: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_brand: string;
    item_variant: string;
    price: number;
    quantity: number;
  }>
}) => {
  trackEvent('purchase', {
    transaction_id: transaction.transaction_id,
    value: transaction.value,
    currency: 'BRL',
    items: transaction.items
  });
};

export const trackOrderCompleted = (orderId: string, value: number, currency = 'BRL') => {
  trackEvent('order_completed', {
    transaction_id: orderId,
    value,
    currency,
    event_category: 'ecommerce',
  });
};