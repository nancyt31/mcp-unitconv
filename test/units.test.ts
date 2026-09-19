import { test } from "node:test";
import assert from "node:assert/strict";
import { convert, listUnits, UnknownUnitError, DimensionMismatchError } from "../src/units.ts";

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

test("length: km to m", () => {
  assertClose(convert(1, "km", "m"), 1000);
});

test("length: mi to ft", () => {
  assertClose(convert(1, "mi", "ft"), 5280, 1e-3);
});

test("length round trip", () => {
  assertClose(convert(convert(42, "ft", "cm"), "cm", "ft"), 42);
});

test("mass: lb to kg", () => {
  assertClose(convert(1, "lb", "kg"), 0.45359237);
});

test("time: h to s", () => {
  assertClose(convert(2, "h", "s"), 7200);
});

test("temperature: C to F, boiling point", () => {
  assertClose(convert(100, "C", "F"), 212);
});

test("temperature: F to C, freezing point", () => {
  assertClose(convert(32, "F", "C"), 0);
});

test("temperature: C to K", () => {
  assertClose(convert(0, "C", "K"), 273.15);
});

test("same unit is a no-op", () => {
  assertClose(convert(7, "kg", "kg"), 7);
});

test("dimension mismatch throws", () => {
  assert.throws(() => convert(1, "km", "kg"), DimensionMismatchError);
});

test("unknown unit throws", () => {
  assert.throws(() => convert(1, "parsec", "m"), UnknownUnitError);
  assert.throws(() => convert(1, "m", "parsec"), UnknownUnitError);
});

test("aliases: full unit names resolve to their shorthand", () => {
  assertClose(convert(1, "kilometers", "meters"), 1000);
  assertClose(convert(1, "mile", "feet"), 5280, 1e-3);
  assertClose(convert(1, "pounds", "kg"), 0.45359237);
  assertClose(convert(2, "hours", "seconds"), 7200);
});

test("aliases: temperature names, case-insensitive", () => {
  assertClose(convert(100, "Celsius", "fahrenheit"), 212);
  assertClose(convert(0, "CELSIUS", "kelvin"), 273.15);
});

test("aliases: unknown alias still throws UnknownUnitError", () => {
  assert.throws(() => convert(1, "furlong", "m"), UnknownUnitError);
});

test("listUnits covers every dimension", () => {
  const units = listUnits();
  for (const u of ["m", "kg", "s", "C", "F", "K"]) {
    assert.ok(units.includes(u), `${u} should be listed`);
  }
});
