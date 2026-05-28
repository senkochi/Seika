export const toDateOnlyString = (value: Date) =>
  value.toISOString().split("T")[0];
