const MIN_LENGTH = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /[0-9]/;

export function checkPassword(p: string) {
  return {
    length: p.length >= MIN_LENGTH,
    upper: HAS_UPPER.test(p),
    lower: HAS_LOWER.test(p),
    number: HAS_NUMBER.test(p),
  };
}

export function isPasswordValid(p: string): boolean {
  const reqs = checkPassword(p);
  return reqs.length && reqs.upper && reqs.lower && reqs.number;
}
