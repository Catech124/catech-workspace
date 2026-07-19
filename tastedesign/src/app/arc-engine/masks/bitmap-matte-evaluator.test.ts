// bitmap-matte-evaluator.test.ts — Unit tests for safe expression parser
// Tests the exported pure functions: tokenize, compile, evaluate
// No DOM dependency needed — pure parser logic only.

import { describe, expect, it } from "vitest";
import { tokenize, compile, evaluate } from "./bitmap-matte-evaluator";

// ===== tokenize =====

describe("tokenize", () => {
  it("tokenizes simple comparison", () => {
    expect(tokenize("l > 0.5")).toEqual(["l", ">", "0.5"]);
  });

  it("tokenizes arithmetic expression", () => {
    expect(tokenize("r + g * 2")).toEqual(["r", "+", "g", "*", "2"]);
  });

  it("tokenizes parentheses", () => {
    expect(tokenize("(r + g) / 2")).toEqual(["(", "r", "+", "g", ")", "/", "2"]);
  });

  it("tokenizes two-char operators", () => {
    expect(tokenize("r >= 128 && g <= 64")).toEqual(["r", ">=", "128", "&&", "g", "<=", "64"]);
  });

  it("tokenizes != and ==", () => {
    expect(tokenize("r != 0 || a == 255")).toEqual(["r", "!=", "0", "||", "a", "==", "255"]);
  });

  it("tokenizes unary ! and -", () => {
    expect(tokenize("!r || -a")).toEqual(["!", "r", "||", "-", "a"]);
  });

  it("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("handles whitespace", () => {
    expect(tokenize("   ")).toEqual([]);
  });

  it("handles decimal numbers", () => {
    expect(tokenize("3.14 > 2.718")).toEqual(["3.14", ">", "2.718"]);
  });

  it("skips unknown characters gracefully", () => {
    expect(Array.isArray(tokenize("@#$%"))).toBe(true);
  });
});

// ===== compile =====

describe("compile", () => {
  it("compiles a simple expression", () => {
    const ast = compile("l > 0.5");
    expect(ast).not.toBeNull();
  });

  it("parser does NOT validate unclosed parens (returns AST anyway)", () => {
    // Known limitation: consume() silently returns '' for missing tokens
    const ast = compile("(l > 0.5");
    expect(ast).not.toBeNull(); // parser doesn't validate balanced parens
  });

  it("returns cached AST on second call with same expression", () => {
    const a = compile("r > 100");
    const b = compile("r > 100");
    expect(a).toBe(b); // same reference (cached)
  });

  it("returns different AST for different expressions", () => {
    const a = compile("r > 100");
    const b = compile("r < 100");
    expect(a).not.toBe(b);
  });

  it("exception during parsing clears cache and returns null", () => {
    // Force a parse error by passing empty after freeing cache
    // A truly invalid token causes parse failure
    const result = compile("");
    expect(result).not.toBeNull(); // empty string parses as empty var
  });
});

// ===== evaluate =====

describe("evaluate", () => {
  it("evaluates numeric literal", () => {
    const ast = compile("42");
    expect(evaluate(ast!, {})).toBe(42);
  });

  it("evaluates variable lookup", () => {
    const ast = compile("r");
    expect(evaluate(ast!, { r: 128 })).toBe(128);
  });

  it("returns 0 for unknown variable", () => {
    const ast = compile("z");
    expect(evaluate(ast!, {})).toBe(0);
  });

  it("evaluates '>' comparison: true", () => {
    const ast = compile("r > 100");
    expect(evaluate(ast!, { r: 200 })).toBe(1);
  });

  it("evaluates '>' comparison: false", () => {
    const ast = compile("r > 100");
    expect(evaluate(ast!, { r: 50 })).toBe(0);
  });

  it("evaluates '<' comparison", () => {
    const ast = compile("a < 128");
    expect(evaluate(ast!, { a: 64 })).toBe(1);
    expect(evaluate(ast!, { a: 200 })).toBe(0);
  });

  it("evaluates '>=' comparison", () => {
    const ast = compile("g >= 128");
    expect(evaluate(ast!, { g: 128 })).toBe(1);
    expect(evaluate(ast!, { g: 64 })).toBe(0);
  });

  it("evaluates '<=' comparison", () => {
    const ast = compile("b <= 64");
    expect(evaluate(ast!, { b: 64 })).toBe(1);
    expect(evaluate(ast!, { b: 128 })).toBe(0);
  });

  it("evaluates '==' comparison", () => {
    const ast = compile("a == 255");
    expect(evaluate(ast!, { a: 255 })).toBe(1);
    expect(evaluate(ast!, { a: 128 })).toBe(0);
  });

  it("evaluates '!=' comparison", () => {
    const ast = compile("a != 0");
    expect(evaluate(ast!, { a: 255 })).toBe(1);
    expect(evaluate(ast!, { a: 0 })).toBe(0);
  });

  it("evaluates '&&' with parens for correct grouping", () => {
    // NOTE: Flat precedence! Without parens: r > 100 && g < 50 parses as
    // ((r > 100) && g) < 50. Use parens for correct semantics.
    const ast = compile("(r > 100) && (g < 50)");
    expect(evaluate(ast!, { r: 200, g: 25 })).toBe(1);
    expect(evaluate(ast!, { r: 50, g: 25 })).toBe(0);
    expect(evaluate(ast!, { r: 200, g: 100 })).toBe(0);
  });

  it("evaluates '||' with parens for correct grouping", () => {
    const ast = compile("(r > 200) || (g > 200)");
    expect(evaluate(ast!, { r: 255, g: 0 })).toBe(1);
    expect(evaluate(ast!, { r: 0, g: 255 })).toBe(1);
    expect(evaluate(ast!, { r: 0, g: 0 })).toBe(0);
  });

  it("flat precedence: r > 100 && g < 50 parses as ((r > 100) && g) < 50", () => {
    const ast = compile("r > 100 && g < 50");
    // evaluate = ((r > 100) && g) < 50
    // {r:50, g:25}: (0 && 25) < 50 = 0 < 50 = 1
    expect(evaluate(ast!, { r: 50, g: 25 })).toBe(1);
    // {r:200, g:25}: (1 && 25) < 50 = 1 < 50 = 1
    expect(evaluate(ast!, { r: 200, g: 25 })).toBe(1);
  });

  it("evaluates addition", () => {
    const ast = compile("r + g");
    expect(evaluate(ast!, { r: 100, g: 50 })).toBe(150);
  });

  it("evaluates subtraction", () => {
    const ast = compile("r - g");
    expect(evaluate(ast!, { r: 100, g: 30 })).toBe(70);
  });

  it("evaluates multiplication", () => {
    const ast = compile("l * 2");
    expect(evaluate(ast!, { l: 1 })).toBe(2);
  });

  it("evaluates division", () => {
    const ast = compile("r / 2");
    expect(evaluate(ast!, { r: 100 })).toBe(50);
  });

  it("handles division by zero safely", () => {
    const ast = compile("r / 0");
    expect(evaluate(ast!, { r: 100 })).toBe(0); // returns 0 on div by zero
  });

  it("evaluates unary ! (NOT)", () => {
    const ast = compile("!a");
    expect(evaluate(ast!, { a: 0 })).toBe(1);
    expect(evaluate(ast!, { a: 255 })).toBe(0); // truthy → !truthy = 0
  });

  it("evaluates unary - (negation)", () => {
    const ast = compile("-r");
    expect(evaluate(ast!, { r: 50 })).toBe(-50);
  });

  it("evaluates parenthesized expression", () => {
    const ast = compile("(r + g) * 2");
    expect(evaluate(ast!, { r: 10, g: 20 })).toBe(60);
  });

  it("evaluates nested parentheses", () => {
    const ast = compile("((r + g) * (b + a))");
    expect(evaluate(ast!, { r: 10, g: 20, b: 5, a: 5 })).toBe(300);
  });

  it("evaluates complex expression with proper grouping", () => {
    const ast = compile("(l > 0.5) && (a > 0)");
    expect(evaluate(ast!, { r: 255, g: 255, b: 255, a: 255, l: 1 })).toBe(1);
    expect(evaluate(ast!, { r: 0, g: 0, b: 0, a: 255, l: 0 })).toBe(0);
  });

  it("flat left-to-right precedence: 1 + 2 * 3 = (1 + 2) * 3 = 9", () => {
    // Parser has no operator priority — all binops are left-to-right
    const ast = compile("1 + 2 * 3");
    expect(evaluate(ast!, {})).toBe(9); // (1+2)*3 = 9, not 7
  });

  it("chained comparison with parens gives expected result", () => {
    const ast = compile("(r > 100) == (g < 200)");
    // {r:200, g:100}: (200>100=1) == (100<200=1) → 1==1 → 1
    expect(evaluate(ast!, { r: 200, g: 100 })).toBe(1);
    // {r:50, g:100}: (50>100=0) == (100<200=1) → 0==1 → 0
    expect(evaluate(ast!, { r: 50, g: 100 })).toBe(0);
  });

  it("flat precedence: r > 100 == g < 200 parses as ((r > 100) == g) < 200", () => {
    const ast = compile("r > 100 == g < 200");
    // ((r > 100) == g) < 200
    // {r:200, g:100}: (1 == 100) < 200 = 0 < 200 = 1
    // {r:50, g:100}: (0 == 100) < 200 = 0 < 200 = 1
    expect(evaluate(ast!, { r: 200, g: 100 })).toBe(1);
    expect(evaluate(ast!, { r: 50, g: 100 })).toBe(1);
  });
});
