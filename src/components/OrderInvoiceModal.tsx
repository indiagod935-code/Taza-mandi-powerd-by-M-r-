import React, { useState } from 'react';
import { CustomerOrder, BrandConfig } from '../types';
import { SafeProductImg } from './SafeProductImg';
import {
  OFFICIAL_UPI_CONFIG,
  generateUpiUrl,
  generateUpiQrCodeUrl,
  generateOrderWhatsAppBillText,
  getWhatsAppBillUrl,
} from '../utils/billingUtils';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Leaf,
  Smartphone,
  ExternalLink,
  Phone,
} from 'lucide-react';

interface OrderInvoiceModalProps {
  order: CustomerOrder | null;
  brand: BrandConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  brand,
  isOpen,
  onClose,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBill, setCopiedBill] = useState(false);

  if (!isOpen || !order) return null;

  const upiUrl = generateUpiUrl(order.totalAmount, order.id);
  const upiQrCodeUrl = generateUpiQrCodeUrl(order.totalAmount, order.id);
  const billText = generateOrderWhatsAppBillText(order, brand);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(OFFICIAL_UPI_CONFIG.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyBill = () => {
    navigator.clipboard?.writeText(billText);
    setCopiedBill(true);
    setTimeout(() => setCopiedBill(false), 2000);
  };

  const whatsappBillHref = getWhatsAppBillUrl(order.phone, billText);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Actions Bar (Non-Printable) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Official Tax & Delivery Bill
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              #{order.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Print Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <a
              href={whatsappBillHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Send bill on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Bill</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div id="printable-invoice" className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200">
          {/* Header Brand Lockup */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-2xl font-display font-black text-emerald-800 dark:text-emerald-400 tracking-tight">
                {brand.brandName || 'ताज़ाMandi'}
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                powered by MARCO 💯
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Wholesale APMC Mandi Produce & Authentic Mobile Accessories Direct-to-Society
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                Navi Mumbai APMC Market Yard · FSSAI & Mandi Registered
              </div>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1">
              <div className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                INVOICE #{order.id}
              </div>
              <div className="text-slate-500">
                Date: <strong className="text-slate-700 dark:text-slate-300">{order.orderedAt}</strong>
              </div>
              <div className="text-slate-500">
                Delivery: <strong className="text-emerald-700 dark:text-emerald-400">{order.targetDeliveryDate}</strong>
              </div>
              <div className="text-slate-500">
                Slot: <span className="font-semibold">{order.deliverySlot}</span>
              </div>
            </div>
          </div>

          {/* Billed To / Society Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Billed To (Customer)
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                {order.customerName}
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                {order.phone || '+91 88288 22808'}
              </div>
              <div className="text-slate-500 truncate">{order.customerEmail}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Delivery Destination
              </div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                Flat {order.flatNumber}
              </div>
              <div className="text-slate-600 dark:text-slate-400">{brand.societyName}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Batch: {order.cutoffBatch === 'tomorrow_morning' ? 'Pre-11 PM (Morning Run)' : 'Post-11 PM (Rollover)'}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Itemized Manifest
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Category</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {/* Produce Items */}
                  {order.produceItems.map((prod, idx) => (
                    <tr key={`prod-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <SafeProductImg
                            product={prod.produceId}
                            alt={prod.name.en}
                            className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold">{prod.name.hi || prod.name.en}</div>
                            <div className="text-[10px] text-slate-400">{prod.name.en}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                          <Leaf className="w-2.5 h-2.5" /> Produce
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{prod.pricePerKg}/kg</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {prod.quantityKg} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₹{prod.itemTotal}</td>
                    </tr>
                  ))}

                  {/* Accessories */}
                  {order.accessoryItems.map((acc, idx) => (
                    <tr key={`acc-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <SafeProductImg
                            product={acc.accessoryId}
                            alt={acc.name.en}
                            isAccessory
                            className="w-7 h-7 rounded object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold">{acc.name.en}</div>
                            <div className="text-[10px] text-sky-600 dark:text-sky-400">MARCO 100 Warranty</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded font-medium">
                          <Smartphone className="w-2.5 h-2.5" /> Tech
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{acc.price}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-700 dark:text-sky-400">
                        {acc.quantity} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₹{acc.itemTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 space-y-1">
              <div>Total Produce Weight: <strong className="text-slate-800 dark:text-slate-200">{order.totalProduceWeightKg} kg</strong></div>
              <div>Mobile Accessories: <strong className="text-slate-800 dark:text-slate-200">{order.totalAccessoriesCount} items</strong></div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                ✓ Sourced from APMC Vashi 4 AM Lot · Zero Stale Inventory
              </div>
            </div>

            <div className="w-full sm:w-60 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Wholesale Savings:</span>
                <span className="font-mono font-bold">-₹140</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Doorstep Delivery:</span>
                <span className="font-mono text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Total Payable:</span>
                <span className="font-mono font-black text-xl text-emerald-700 dark:text-emerald-400">
                  ₹{order.totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC KOTAK BANK UPI QR CODE SECTION */}
          <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-50 via-white to-slate-50 dark:from-slate-850 dark:via-slate-900 dark:to-emerald-950/30 border-2 border-emerald-500/50 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Scan-Ready QR Code */}
              <div className="bg-white p-3 rounded-xl border-2 border-emerald-700/60 shadow-md shrink-0 text-center">
                <img
                  src={upiQrCodeUrl}
                  alt={`Kotak UPI QR Code for ₹${order.totalAmount}`}
                  className="w-40 h-40 object-contain mx-auto"
                />
                <div className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                  Scan to Pay ₹{order.totalAmount}
                </div>
              </div>

              {/* UPI Details & Instructions */}
              <div className="flex-1 min-w-0 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-700 text-white p-1 rounded-md">
                    <QrCode className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Instant Kotak UPI QR Payment
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Scan with <strong>Google Pay, PhonePe, Paytm, BHIM</strong> or any UPI bank app. The exact bill amount (₹{order.totalAmount}) is automatically pre-filled.
                </p>

                {/* Kotak Bank UPI ID Card */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">Kotak Bank UPI ID</div>
                    <div className="font-mono font-black text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm truncate">
                      {OFFICIAL_UPI_CONFIG.upiId}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-semibold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={upiUrl}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pay via UPI App Directly</span>
                  </a>

                  <button
                    onClick={handleCopyBill}
                    className="py-2 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    title="Copy full WhatsApp bill text"
                  >
                    {copiedBill ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBill ? 'Bill Copied!' : 'Copy Bill'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              Support & WhatsApp: <strong className="text-slate-600 dark:text-slate-300">+91 88288 22808</strong>
            </div>
            <div>
              ताज़ाMandi · powered by MARCO 💯
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
