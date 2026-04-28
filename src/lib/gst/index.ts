/**
 * @file index.ts — Barrel for the GST mapping module.
 * @module lib/gst
 */

export { buildCategoryIndex, type GstCategoryRow } from "./categoryMapping";
export { computeGstAmount } from "./computeGstAmount";
export { computeTcsAmount, type TcsInputCategory } from "./computeTcsAmount";
export { mapGstFields } from "./mapGstFields";
