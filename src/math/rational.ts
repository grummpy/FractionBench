/**
 * Exact rational arithmetic. Comparisons use integer cross-products.
 * This module does not enforce curriculum input limits.
 */

export type Rational = {
  readonly numerator: bigint;
  readonly denominator: bigint;
};

export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

export function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) {
    throw new Error("lcm requires nonzero integers");
  }
  const aa = a < 0n ? -a : a;
  const bb = b < 0n ? -b : b;
  return (aa / gcd(aa, bb)) * bb;
}

/** Rejects a zero denominator, normalizes sign, and reduces by the GCD. */
export function rational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) {
    throw new Error("denominator must not be zero");
  }
  let n = numerator;
  let d = denominator;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return Object.freeze({ numerator: n / g, denominator: d / g });
}

export function add(a: Rational, b: Rational): Rational {
  return rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

/** Negative when a < b, zero when equal, positive when a > b. */
export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const left = a.numerator * b.denominator;
  const right = b.numerator * a.denominator;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function equal(a: Rational, b: Rational): boolean {
  return compare(a, b) === 0;
}

export function formatRational(value: Rational): string {
  return `${value.numerator.toString()}/${value.denominator.toString()}`;
}

export function isWholeAtMost(value: Rational, wholes: bigint): boolean {
  return value.numerator <= value.denominator * wholes;
}

export function exceedsOne(value: Rational): boolean {
  return value.numerator > value.denominator;
}
