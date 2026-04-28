/**
 * @file index.ts — Barrel for the analytics service module.
 * @module lib/analytics
 */

export { getTotals, type DashboardTotals } from "./totals";
export { getCashFlow, type CashFlowDay } from "./cashFlow";
export { getChannelSplit, type ChannelSlice } from "./channelSplit";
