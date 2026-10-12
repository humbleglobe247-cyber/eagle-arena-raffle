import { prisma } from "../config/prisma";
import { getSettings, isSalesOpen } from "./settingsService";

export type OrderStatusFilter = "PENDING" | "PAID" | "FAILED";

export async function getSummary() {
  const [settings, ticketsSold, paid, byStatus, buyers] = await Promise.all([
    getSettings(),
    prisma.ticket.count(), // tickets only exist for paid orders
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.groupBy({ by: ["email"], where: { status: "PAID" } }),
  ]);

  const countOf = (status: OrderStatusFilter) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    ticketsSold,
    revenue: paid._sum.amount ?? 0, // kobo
    paidOrders: countOf("PAID"),
    pendingOrders: countOf("PENDING"),
    failedOrders: countOf("FAILED"),
    uniqueBuyers: buyers.length,
    ticketPrice: settings.ticketPrice,
    nextTicketNumber: settings.nextTicketNumber,
    closesAt: settings.closesAt,
    salesOpen: isSalesOpen(settings),
  };
}

type OrdersQuery = {
  page: number;
  limit: number;
  status?: OrderStatusFilter;
  search?: string;
};

export async function listOrders({ page, limit, status, search }: OrdersQuery) {
  const where = {
    ...(status && { status }),
    ...(search && { email: { contains: search, mode: "insensitive" as const } }),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        reference: true,
        email: true,
        quantity: true,
        amount: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    }),
  ]);

  // The tickets in one order are consecutive, so the first and last number describe them all.
  const ranges = orders.length
    ? await prisma.ticket.groupBy({
        by: ["orderId"],
        where: { orderId: { in: orders.map((order) => order.id) } },
        _min: { number: true },
        _max: { number: true },
      })
    : [];
  const rangeByOrder = new Map(ranges.map((range) => [range.orderId, range]));

  return {
    items: orders.map((order) => ({
      ...order,
      ticketFrom: rangeByOrder.get(order.id)?._min.number ?? null,
      ticketTo: rangeByOrder.get(order.id)?._max.number ?? null,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

type BuyersQuery = { page: number; limit: number; search?: string };

export async function listBuyers({ page, limit, search }: BuyersQuery) {
  const where = {
    status: "PAID" as const,
    ...(search && { email: { contains: search, mode: "insensitive" as const } }),
  };

  // One extra row is fetched to find out whether there is a next page.
  const rows = await prisma.order.groupBy({
    by: ["email"],
    where,
    _sum: { quantity: true, amount: true },
    _count: { _all: true },
    _max: { paidAt: true },
    orderBy: [{ _max: { paidAt: "desc" } }, { email: "asc" }],
    skip: (page - 1) * limit,
    take: limit + 1,
  });

  return {
    items: rows.slice(0, limit).map((row) => ({
      email: row.email,
      tickets: row._sum.quantity ?? 0,
      totalSpent: row._sum.amount ?? 0, // kobo
      orders: row._count._all,
      lastPurchaseAt: row._max.paidAt,
    })),
    page,
    limit,
    hasMore: rows.length > limit,
  };
}