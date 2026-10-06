import { describe, expect, it } from "vitest";
import { add, compare, equal, rational } from "../src/math/rational";

describe("rational arithmetic", () => {
  it("reduces, accepts zero and improper values, and adds exactly", () => {
    expect(rational(4n, 6n)).toEqual({ numerator: 2n, denominator: 3n });
    expect(rational(0n, 5n)).toEqual({ numerator: 0n, denominator: 1n });
    expect(rational(17n, 12n)).toEqual({ numerator: 17n, denominator: 12n });
    expect(add(rational(1n, 2n), rational(1n, 3n))).toEqual({ numerator: 5n, denominator: 6n });
    expect(add(rational(5n, 6n), rational(1n, 3n))).toEqual({ numerator: 7n, denominator: 6n });
    expect(compare(rational(1n, 3n), rational(2n, 6n))).toBe(0);
  });

  it("rejects a zero denominator", () => {
    expect(() => rational(1n, 0n)).toThrow(/zero/);
  });

  it("normalizes sign without mutating inputs", () => {
    const left = rational(2n, 4n);
    const frozen = { numerator: left.numerator, denominator: left.denominator };
    const sum = add(left, rational(1n, 3n));
    expect(left).toEqual(frozen);
    expect(sum).not.toBe(left);
    expect(rational(-2n, -4n)).toEqual({ numerator: 1n, denominator: 2n });
    expect(rational(2n, -4n)).toEqual({ numerator: -1n, denominator: 2n });
  });

  it("compares large values that floating point cannot separate", () => {
    const almostOne = rational(10n ** 40n + 3n, 10n ** 40n);
    expect(equal(almostOne, rational(1n, 1n))).toBe(false);
  });

  it("preserves scaling, commutativity, and simplification for bounded integers", () => {
    for (let numerator = 0; numerator <= 12; numerator += 1) {
      for (let denominator = 1; denominator <= 12; denominator += 1) {
        for (let factor = 1; factor <= 12; factor += 1) {
          expect(
            equal(
              rational(BigInt(numerator), BigInt(denominator)),
              rational(BigInt(numerator) * BigInt(factor), BigInt(denominator) * BigInt(factor)),
            ),
          ).toBe(true);
        }
      }
    }
    for (let left = 0; left <= 6; left += 1) {
      for (let right = 0; right <= 6; right += 1) {
        const a = rational(BigInt(left), 5n);
        const b = rational(BigInt(right), 7n);
        expect(equal(add(a, b), add(b, a))).toBe(true);
      }
    }
  });
});
