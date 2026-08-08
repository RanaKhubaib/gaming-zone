export const ConsoleType = {
  PS4: "PS4",
  PS5: "PS5",
  XBOX: "XBOX",
  PC: "PC",
  OTHER: "OTHER",
} as const;
export type ConsoleType = (typeof ConsoleType)[keyof typeof ConsoleType];

export const StationStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
} as const;
export type StationStatus = (typeof StationStatus)[keyof typeof StationStatus];

export const EntryMode = {
  MANUAL: "MANUAL",
  TIMER: "TIMER",
} as const;
export type EntryMode = (typeof EntryMode)[keyof typeof EntryMode];

export const PaymentStatus = {
  PAID: "PAID",
  UNPAID: "UNPAID",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
