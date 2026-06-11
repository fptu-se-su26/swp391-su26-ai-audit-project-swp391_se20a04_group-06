/**
 * Seafood Shop Application Global Constants
 */

export const SUBSCRIPTION_PRICES = {
  Small: 500000,
  Medium: 900000,
  Large: 1500000,
} as const;

export type PackageType = keyof typeof SUBSCRIPTION_PRICES;
