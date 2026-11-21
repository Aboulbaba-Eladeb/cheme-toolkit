// Verification values published in IAPWS R7-97(2012), Tables 5, 15, 35 and 36.
import { describe, expect, it } from "vitest";
import { psat, tsat, region1, region2 } from "./iapws97";

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("IAPWS-IF97 region 4 (saturation)", () => {
  it.each([[300, 0.353658941e-2], [500, 0.263889776e1], [600, 0.123443146e2]])("psat(%s K)", (T, p) => {
    expect(rel(psat(T), p)).toBeLessThan(1e-8);
  });
  it.each([[0.1, 0.372755919e3], [1, 0.453035632e3], [10, 0.584149488e3]])("tsat(%s MPa)", (p, T) => {
    expect(rel(tsat(p), T)).toBeLessThan(1e-8);
  });
});

describe("IAPWS-IF97 region 1 (liquid)", () => {
  it.each([
    [300, 3, 0.100215168e-2, 0.115331273e3, 0.392294792, 0.417301218e1],
    [300, 80, 0.971180894e-3, 0.184142828e3, 0.368563852, 0.401008987e1],
    [500, 3, 0.120241800e-2, 0.975542239e3, 0.258041912e1, 0.465580682e1],
  ])("T=%s K, p=%s MPa", (T, p, v, h, s, cp) => {
    const r = region1(p, T);
    expect(rel(r.v, v)).toBeLessThan(1e-8);
    expect(rel(r.h, h)).toBeLessThan(1e-8);
    expect(rel(r.s, s)).toBeLessThan(1e-8);
    expect(rel(r.cp, cp)).toBeLessThan(1e-8);
  });
});

describe("IAPWS-IF97 region 2 (vapour)", () => {
  it.each([
    [300, 0.0035, 0.394913866e2, 0.254991145e4, 0.852238967e1, 0.191300162e1],
    [700, 0.0035, 0.923015898e2, 0.333568375e4, 0.101749996e2, 0.208141274e1],
    [700, 30, 0.542946619e-2, 0.263149474e4, 0.517540298e1, 0.103505092e2],
  ])("T=%s K, p=%s MPa", (T, p, v, h, s, cp) => {
    const r = region2(p, T);
    expect(rel(r.v, v)).toBeLessThan(1e-8);
    expect(rel(r.h, h)).toBeLessThan(1e-8);
    expect(rel(r.s, s)).toBeLessThan(1e-8);
    expect(rel(r.cp, cp)).toBeLessThan(1e-8);
  });
});
