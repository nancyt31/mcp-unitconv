export type Dimension = "length" | "mass" | "time" | "temperature";

interface UnitDefinition {
  dimension: Dimension;
  // Every unit converts through a base unit for its dimension (meter, kilogram,
  // second, kelvin). Temperature needs an affine map, not a plain factor, so
  // toBase/fromBase are functions rather than a single scale number.
  toBase(value: number): number;
  fromBase(value: number): number;
}

function linear(dimension: Dimension, factor: number): UnitDefinition {
  return {
    dimension,
    toBase: (value) => value * factor,
    fromBase: (value) => value / factor,
  };
}

const UNITS: Record<string, UnitDefinition> = {
  // length, base = meter
  m: linear("length", 1),
  km: linear("length", 1000),
  cm: linear("length", 0.01),
  mm: linear("length", 0.001),
  mi: linear("length", 1609.344),
  yd: linear("length", 0.9144),
  ft: linear("length", 0.3048),
  in: linear("length", 0.0254),

  // mass, base = kilogram
  kg: linear("mass", 1),
  g: linear("mass", 0.001),
  mg: linear("mass", 0.000001),
  lb: linear("mass", 0.45359237),
  oz: linear("mass", 0.028349523125),

  // time, base = second
  s: linear("time", 1),
  ms: linear("time", 0.001),
  min: linear("time", 60),
  h: linear("time", 3600),
  day: linear("time", 86400),

  // temperature, base = kelvin
  K: {
    dimension: "temperature",
    toBase: (value) => value,
    fromBase: (value) => value,
  },
  C: {
    dimension: "temperature",
    toBase: (value) => value + 273.15,
    fromBase: (value) => value - 273.15,
  },
  F: {
    dimension: "temperature",
    toBase: (value) => ((value - 32) * 5) / 9 + 273.15,
    fromBase: (value) => ((value - 273.15) * 9) / 5 + 32,
  },
};

// Common full-word names for units in UNITS, so callers don't have to know the
// shorthand. Matched case-insensitively; UNITS itself stays case-sensitive
// since "m" and "min" would otherwise collide.
const ALIASES: Record<string, string> = {
  meter: "m",
  meters: "m",
  metre: "m",
  metres: "m",
  kilometer: "km",
  kilometers: "km",
  kilometre: "km",
  kilometres: "km",
  centimeter: "cm",
  centimeters: "cm",
  centimetre: "cm",
  centimetres: "cm",
  millimeter: "mm",
  millimeters: "mm",
  millimetre: "mm",
  millimetres: "mm",
  mile: "mi",
  miles: "mi",
  yard: "yd",
  yards: "yd",
  foot: "ft",
  feet: "ft",
  inch: "in",
  inches: "in",
  kilogram: "kg",
  kilograms: "kg",
  gram: "g",
  grams: "g",
  milligram: "mg",
  milligrams: "mg",
  pound: "lb",
  pounds: "lb",
  ounce: "oz",
  ounces: "oz",
  second: "s",
  seconds: "s",
  millisecond: "ms",
  milliseconds: "ms",
  minute: "min",
  minutes: "min",
  hour: "h",
  hours: "h",
  day: "day",
  days: "day",
  kelvin: "K",
  celsius: "C",
  centigrade: "C",
  fahrenheit: "F",
};

function resolveUnit(name: string): UnitDefinition | undefined {
  return UNITS[name] ?? UNITS[ALIASES[name.toLowerCase()]];
}

export class UnknownUnitError extends Error {
  constructor(unit: string) {
    super(`unknown unit: ${unit}`);
    this.name = "UnknownUnitError";
  }
}

export class DimensionMismatchError extends Error {
  constructor(from: string, to: string, fromDim: Dimension, toDim: Dimension) {
    super(`dimension mismatch: ${from} is ${fromDim}, ${to} is ${toDim}`);
    this.name = "DimensionMismatchError";
  }
}

export function listUnits(): string[] {
  return Object.keys(UNITS);
}

export function convert(value: number, from: string, to: string): number {
  const fromUnit = resolveUnit(from);
  if (!fromUnit) throw new UnknownUnitError(from);

  const toUnit = resolveUnit(to);
  if (!toUnit) throw new UnknownUnitError(to);

  if (fromUnit.dimension !== toUnit.dimension) {
    throw new DimensionMismatchError(from, to, fromUnit.dimension, toUnit.dimension);
  }

  return toUnit.fromBase(fromUnit.toBase(value));
}
