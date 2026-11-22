import { CustomerOrder, BrandConfig } from '../types';

export const OFFICIAL_UPI_CONFIG = {
  upiId: '8828822808@kotakbank',
  bankName: 'Kotak Mahindra Bank',
  payeeName: 'ताज़ाMandi · MARCO 100',
  merchantName: 'TazaMandi MARCO 100',
  contactPhone: '+91 88288 22808',
};

/**
 * Generates an official standard UPI Deep Link URL for instant app payments
 */
export function generateUpiUrl(amount: number, orderId: string, note?: string): string {
  const transactionNote = note || `Order_${orderId}_Mandi`;
  const cleanAmount = Number(amount).toFixed(2);
  return `upi://pay?pa=${OFFICIAL_UPI_CONFIG.upiId}&pn=${encodeURIComponent(
    OFFICIAL_UPI_CONFIG.merchantName
  )}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
}

/**
 * Generates a high-resolution, scan-ready dynamic QR Code image URL
 */
export function generateUpiQrCodeUrl(amount: number, orderId: string): string {
  const upiLink = generateUpiUrl(amount, orderId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiLink
  )}&margin=10&color=052e16`;
}

/**
 * Generates a formatted WhatsApp Bill / Invoice receipt message with full itemization
 */
export function generateOrderWhatsAppBillText(
  order: CustomerOrder,
  brand: BrandConfig,
  appUrl: string = window.location.origin
): string {
  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━';
  const orderDate = order.orderedAt || 'Today';
  const deliveryDate = order.targetDeliveryDate || 'Tomorrow Morning';
  const batchTag =
    order.cutoffBatch === 'tomorrow_morning'
      ? '✅ Pre-11 PM (Tonight 4 AM APMC Dawn Sourcing)'
      : '🌙 Post-11 PM (Next Night APMC Sourcing)';

  let produceSection = '';
  if (order.produceItems && order.produceItems.length > 0) {
    produceSection = order.produceItems
      .map((it) => {
        const itemName = it.name.hi || it.name.en;
        return `• 🥬 *${itemName}*: ${it.quantityKg} kg × ₹${it.pricePerKg} = ₹${it.itemTotal}`;
      })
      .join('\n');
  }

  let accessoriesSection = '';
  if (order.accessoryItems && order.accessoryItems.length > 0) {
    accessoriesSection = order.accessoryItems
      .map((acc) => {
        const accName = acc.name.hi || acc.name.en;
        return `• ⚡ *${accName}*: ${acc.quantity} pcs × ₹${acc.price} = ₹${acc.itemTotal} (MARCO 100)`;
      })
      .join('\n');
  }

  const itemsList = [produceSection, accessoriesSection].filter(Boolean).join('\n');

  const upiPayLink = generateUpiUrl(order.totalAmount, order.id);

  return `🧾 *${brand.brandName || 'ताज़ाMandi'} · powered by MARCO 💯*
*DIGITAL INVOICE & DELIVERY BILL*
${divider}
📦 *Order ID:* #${order.id}
📅 *Date:* ${orderDate}
👤 *Customer:* ${order.customerName}
🏢 *Flat/Wing:* ${order.flatNumber}
🏘️ *Society:* ${brand.societyName}
📞 *Phone:* ${order.phone || '+91 88288 22808'}

🚚 *Mandi Delivery Slot:* ${order.deliverySlot}
🗓️ *Expected Delivery:* ${deliveryDate}
⏰ *Batch Status:* ${batchTag}

🛒 *ITEMIZED ORDER DETAILS:*
${itemsList}

${divider}
⚖️ *Total Weight:* ${order.totalProduceWeightKg} kg Fresh Produce
⚡ *Tech Items:* ${order.totalAccessoriesCount} MARCO 100 accessories
💰 *GRAND TOTAL BILL:* ₹${order.totalAmount}

💳 *INSTANT UPI PAYMENT:*
• *UPI ID:* ${OFFICIAL_UPI_CONFIG.upiId}
• *Bank:* ${OFFICIAL_UPI_CONFIG.bankName}
• *Payee:* ${OFFICIAL_UPI_CONFIG.payeeName}
• *Direct UPI Pay Link:* ${upiPayLink}

📍 *LIVE MANDI TRACKER:*
${appUrl}

🌿 *ताज़ाMandi Guarantee:* 0% बासी माल · सुबह 4 बजे वाशी मंडी से सीधा उठाव।
${divider}
_Thank you for choosing ${brand.brandName}!_`;
}

/**
 * Builds a clean pre-filled WhatsApp bill URL (used via <a href target="_blank" rel="noopener noreferrer">).
 */
export function getWhatsAppBillUrl(
  phone: string | undefined,
  billText: string
): string {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  return cleanPhone && cleanPhone.length >= 10
    ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(billText)}`
    : `https://wa.me/?text=${encodeURIComponent(billText)}`;
}
