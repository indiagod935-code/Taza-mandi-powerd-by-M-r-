/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Order & Wholesale Mandi Procurement Business Service
 * Separates 24x7 cutoff math, demand aggregation, +buffer sack calculations, and API mutations.
 */
import type { CustomerOrder, MobileAccessoryItem, ProduceItem } from '../types';
import { ENV_CONFIG } from '../config/env';
import { ordersApi } from '../api/endpoints';

export interface ConsolidatedProduceDemandRow {
  produce: ProduceItem;
  rawCustomerKg: number;
  safetyBufferKg: number;
  totalWholesaleKg: number;
  sacksNeeded: number;
  familyCount: number;
  estimatedWholesaleCost: number;
  customerRevenue: number;
  margin: number;
}

export interface ConsolidatedAccessoryDemandRow {
  accessory: MobileAccessoryItem;
  qty: number;
  wholesaleCost: number;
  revenue: number;
  margin: number;
}

export const orderService = {
  isNaturalBeforeCutoff(now: Date = new Date()): boolean {
    return now.getHours() < ENV_CONFIG.MANDI_CUTOFF_HOUR_24;
  },

  computeTimeUntilCutoff(now: Date = new Date()): string {
    const target = new Date(now);
    target.setHours(ENV_CONFIG.MANDI_CUTOFF_HOUR_24, 0, 0, 0);
    if (now.getHours() >= ENV_CONFIG.MANDI_CUTOFF_HOUR_24) {
      target.setDate(target.getDate() + 1);
    }
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return '00h 00m';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
  },

  aggregateProduceProcurement(
    produceList: ProduceItem[],
    orders: CustomerOrder[],
    produceCart: Record<string, number>,
    includeZeroDemandCatalog = false
  ): ConsolidatedProduceDemandRow[] {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const rows: ConsolidatedProduceDemandRow[] = [];

    for (const p of produceList) {
      let orderedKg = 0;
      const families = new Set<string>();
      for (const ord of activeOrders) {
        const match = ord.produceItems.find((i) => i.produceId === p.id);
        if (match && match.quantityKg > 0) {
          orderedKg += match.quantityKg;
          families.add(ord.flatNumber || ord.id);
        }
      }
      const cartKg = produceCart[p.id] || 0;
      if (cartKg > 0) families.add('active-basket');

      const rawCustomerKg = Math.round((orderedKg + cartKg) * 100) / 100;
      if (rawCustomerKg <= 0 && !includeZeroDemandCatalog) continue;

      const safetyBufferKg =
        rawCustomerKg > 0 ? Math.max(1, Math.min(2, Math.round(rawCustomerKg * 0.1 * 10) / 10)) : 0;
      const totalWholesaleKg = Math.round((rawCustomerKg + safetyBufferKg) * 10) / 10;
      const bagSize = p.mandiTierBagKg || 25;
      const sacksNeeded = totalWholesaleKg > 0 ? Math.max(1, Math.ceil(totalWholesaleKg / bagSize)) : 0;
      const estimatedWholesaleCost = Math.round(totalWholesaleKg * p.wholesalePricePerKg);
      const customerRevenue = Math.round(rawCustomerKg * p.pricePerKg);
      const margin = customerRevenue - Math.round(rawCustomerKg * p.wholesalePricePerKg);

      rows.push({
        produce: p,
        rawCustomerKg,
        safetyBufferKg,
        totalWholesaleKg,
        sacksNeeded,
        familyCount: families.size,
        estimatedWholesaleCost,
        customerRevenue,
        margin,
      });
    }

    return rows.sort((a, b) => b.rawCustomerKg - a.rawCustomerKg);
  },

  aggregateAccessoryDemand(
    accessoriesList: MobileAccessoryItem[],
    orders: CustomerOrder[],
    accessoryCart: Record<string, number>,
    includeZeroDemandCatalog = true
  ): ConsolidatedAccessoryDemandRow[] {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const rows: ConsolidatedAccessoryDemandRow[] = [];

    for (const acc of accessoriesList) {
      let qty = accessoryCart[acc.id] || 0;
      for (const ord of activeOrders) {
        const match = ord.accessoryItems.find((i) => i.accessoryId === acc.id);
        if (match) qty += match.quantity;
      }
      if (qty <= 0 && !includeZeroDemandCatalog) continue;
      rows.push({
        accessory: acc,
        qty,
        wholesaleCost: qty * acc.wholesaleCost,
        revenue: qty * acc.price,
        margin: qty * (acc.price - acc.wholesaleCost),
      });
    }

    return rows.sort((a, b) => b.qty - a.qty);
  },

  async persistOrderToBackend(order: CustomerOrder): Promise<CustomerOrder> {
    const res = await ordersApi.create(order);
    return res.order || order;
  },
};
