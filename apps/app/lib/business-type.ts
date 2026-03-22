export type NormalizedBusinessType = "laundry" | "fnb" | "retail";

const BUSINESS_TYPE_ALIASES: Record<string, NormalizedBusinessType> = {
  caffe: "fnb",
  food: "fnb",
  service: "retail",
  other: "retail",
};

export function normalizeBusinessType(input: string): NormalizedBusinessType {
  if (input === "laundry" || input === "fnb" || input === "retail") return input;
  return BUSINESS_TYPE_ALIASES[input] ?? "retail";
}
