import { chapterMap, gradeDefinitions } from "../data/chapters";
import type {
  AnswerMode,
  BlankTarget,
  ChapterDefinition,
  FractionRuleOptions,
  GradeValue,
  LayoutMode,
  NumericRuleOptions,
  StandardProblem,
  WorksheetConfig,
  WorksheetPage,
} from "../types";
import { Random } from "./random";

type Fraction = { numerator: number; denominator: number };

const OP_SYMBOL: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = x % y;
    x = y;
    y = temp;
  }
  return x || 1;
};

const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

const simplifyFraction = (fraction: Fraction): Fraction => {
  const divisor = gcd(fraction.numerator, fraction.denominator);
  const denominator = fraction.denominator / divisor;
  const numerator = fraction.numerator / divisor;
  return denominator < 0
    ? { numerator: -numerator, denominator: -denominator }
    : { numerator, denominator };
};

const fractionToString = (fraction: Fraction) => {
  const simple = simplifyFraction(fraction);
  if (simple.denominator === 1) {
    return String(simple.numerator);
  }
  return `${simple.numerator}/${simple.denominator}`;
};

const decimalPlacesOf = (value: number) => {
  const text = String(value);
  if (!text.includes(".")) {
    return 0;
  }
  return text.split(".")[1]?.length ?? 0;
};

const formatDecimal = (value: number) => {
  return Number(value.toFixed(4)).toString();
};

const hasCarry = (a: number, b: number) => {
  const digitsA = String(Math.abs(a)).split("").reverse();
  const digitsB = String(Math.abs(b)).split("").reverse();
  const max = Math.max(digitsA.length, digitsB.length);
  for (let index = 0; index < max; index += 1) {
    const digitA = Number(digitsA[index] ?? "0");
    const digitB = Number(digitsB[index] ?? "0");
    if (digitA + digitB >= 10) {
      return true;
    }
  }
  return false;
};

const hasBorrow = (a: number, b: number) => {
  const digitsA = String(Math.abs(a)).split("").reverse();
  const digitsB = String(Math.abs(b)).split("").reverse();
  for (let index = 0; index < digitsA.length; index += 1) {
    const digitA = Number(digitsA[index] ?? "0");
    const digitB = Number(digitsB[index] ?? "0");
    if (digitA < digitB) {
      return true;
    }
  }
  return false;
};

const selectBlankTarget = (
  random: Random,
  left: string,
  right: string,
  result: string,
): BlankTarget => {
  const candidates: BlankTarget[] = [];
  if (left !== "0") candidates.push("left");
  if (right !== "0") candidates.push("right");
  if (result !== "0") candidates.push("result");
  return random.pick(candidates.length > 0 ? candidates : ["result"]);
};

const buildVerticalRowsFromBinary = ({
  left,
  symbol,
  right,
  answerMode,
  blankTarget,
}: {
  left: string;
  symbol: string;
  right: string;
  answerMode: AnswerMode;
  blankTarget?: BlankTarget;
}) => {
  return [
    {
      value: answerMode === "blank" && blankTarget === "left" ? "" : left,
    },
    {
      operator: symbol,
      value: answerMode === "blank" && blankTarget === "right" ? "" : right,
    },
  ];
};

const buildVerticalRowsFromExpression = (expression: string) => {
  const compact = expression.replace(/[()\s]/g, "");
  const rows: Array<{ operator?: string; value: string }> = [];
  let buffer = "";
  let pendingOperator: string | undefined;

  for (let index = 0; index < compact.length; index += 1) {
    const char = compact[index];
    if (char === "+" || char === "−" || char === "×" || char === "÷") {
      if (buffer) {
        rows.push(
          pendingOperator
            ? { operator: pendingOperator, value: buffer }
            : { value: buffer },
        );
      }
      buffer = "";
      pendingOperator = char;
      continue;
    }
    buffer += char;
  }

  if (buffer) {
    rows.push(
      pendingOperator
        ? { operator: pendingOperator, value: buffer }
        : { value: buffer },
    );
  }

  return rows;
};

const createProblem = ({
  chapter,
  left,
  operator,
  right,
  result,
  layoutMode,
  answerMode,
  random,
  forceHorizontal,
}: {
  chapter: ChapterDefinition;
  left: string;
  operator: string;
  right: string;
  result: string;
  layoutMode: LayoutMode;
  answerMode: AnswerMode;
  random: Random;
  forceHorizontal?: boolean;
}): StandardProblem => {
  const symbol = OP_SYMBOL[operator] ?? operator;
  const blankTarget =
    answerMode === "blank"
      ? selectBlankTarget(random, left, right, result)
      : undefined;

  const expression =
    answerMode === "oral"
      ? `${left}${symbol}${right}=`
      : blankTarget === "left"
        ? `${symbol}${right}=${result}`
        : blankTarget === "right"
          ? `${left}${symbol}=${result}`
          : `${left}${symbol}${right}=`;

  const isVerticalNative =
    !forceHorizontal &&
    (symbol === "+" || symbol === "−" || symbol === "×" || symbol === "÷") &&
    !left.includes(" ") &&
    !right.includes(" ") &&
    !left.includes("(") &&
    !right.includes("(") &&
    !left.includes("+") &&
    !left.includes("−") &&
    !right.includes("+") &&
    !right.includes("−") &&
    !left.includes("÷") &&
    !right.includes("÷") &&
    !left.includes("×") &&
    !right.includes("×");

  return {
    id: `${chapter.value}-${left}-${operator}-${right}-${result}-${Math.round(random.next() * 1e6)}`,
    chapterId: chapter.value,
    chapterLabel: chapter.label,
    layoutMode,
    answerMode,
    expression,
    answer:
      answerMode === "blank"
        ? blankTarget === "left"
          ? left
          : blankTarget === "right"
            ? right
            : result
        : result,
    blankTarget,
    left,
    operator: symbol,
    right,
    verticalRows: buildVerticalRowsFromBinary({
      left,
      symbol,
      right,
      answerMode,
      blankTarget,
    }),
    verticalTop: blankTarget === "left" && answerMode === "blank" ? "" : left,
    verticalBottom:
      blankTarget === "right" && answerMode === "blank" ? "" : right,
    verticalResult:
      blankTarget === "result" || answerMode === "oral" ? "" : result,
    verticalOperator: symbol,
    verticalAnswer:
      answerMode === "oral" || blankTarget === "result" ? "" : result,
    isVerticalNative,
  };
};

const getNumericRangeValue = (value: number | undefined, fallback: number) =>
  value ?? fallback;

const isMultipleOfTen = (value: number) => value % 10 === 0;
const isMultipleOfHundred = (value: number) => value % 100 === 0;

const integerCandidate = (random: Random, options: NumericRuleOptions) => {
  const a = random.int(
    getNumericRangeValue(options.minA, 0),
    getNumericRangeValue(options.maxA, 20),
  );
  const b = random.int(
    getNumericRangeValue(options.minB, 0),
    getNumericRangeValue(options.maxB, 20),
  );
  return { a, b };
};

const applyIntegerOperator = (a: number, b: number, operator: string) => {
  if (operator === "+") return a + b;
  if (operator === "-") return a - b;
  if (operator === "*") return a * b;
  if (operator === "/") return b === 0 ? NaN : a / b;
  return NaN;
};

const numberToFactorPair = (
  random: Random,
  quotientMin: number,
  quotientMax: number,
  divisorMin: number,
  divisorMax: number,
) => {
  const quotient = random.int(quotientMin, quotientMax);
  const divisor = random.int(divisorMin, divisorMax);
  return { dividend: quotient * divisor, divisor, quotient };
};

const generateAddSub = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as NumericRuleOptions;
  const operators = [
    ...(options.allowAdd ? ["+"] : []),
    ...(options.allowSub ? ["-"] : []),
  ];

  for (let attempts = 0; attempts < 500; attempts += 1) {
    let { a, b } = integerCandidate(random, options);
    const operator = random.pick(operators);

    if (chapter.value === 205) {
      a = a - (a % 10);
      b = b - (b % 10);
    }
    if (chapter.value === 206 || chapter.value === 207) {
      b = random.chance(0.5) ? random.int(1, 9) : random.int(1, 9) * 10;
    }
    if (chapter.value === 311) {
      a = random.chance(0.5) ? random.int(1, 9) * 100 : random.int(1, 9) * 1000;
      b = random.chance(0.5) ? random.int(1, 9) * 100 : random.int(1, 9) * 1000;
    }

    const result = applyIntegerOperator(a, b, operator);
    if (!Number.isInteger(result)) continue;
    if (operator === "-" && result < 0) continue;
    if (options.maxResult !== undefined && result > options.maxResult) continue;
    if (options.enforceCarry && operator === "+" && !hasCarry(a, b)) continue;
    if (options.forbidCarry && operator === "+" && hasCarry(a, b)) continue;
    if (options.enforceBorrow && operator === "-" && !hasBorrow(a, b)) continue;
    if (options.forbidBorrow && operator === "-" && hasBorrow(a, b)) continue;
    if (
      chapter.value === 205 &&
      (!isMultipleOfTen(a) || !isMultipleOfTen(b) || !isMultipleOfTen(result))
    )
      continue;
    if (
      chapter.value === 311 &&
      !(
        isMultipleOfHundred(a) &&
        isMultipleOfHundred(b) &&
        isMultipleOfHundred(result)
      )
    )
      continue;

    return createProblem({
      chapter,
      left: String(a),
      operator,
      right: String(b),
      result: String(result),
      layoutMode,
      answerMode,
      random,
    });
  }

  return createProblem({
    chapter,
    left: "1",
    operator: "+",
    right: "1",
    result: "2",
    layoutMode,
    answerMode,
    random,
  });
};

const decimalValue = (
  random: Random,
  integerMin: number,
  integerMax: number,
  decimalPlaces: number,
) => {
  const factor = 10 ** decimalPlaces;
  return random.int(integerMin * factor, integerMax * factor) / factor;
};

const decimalDigit = (value: number, place: number) => {
  const text = value.toFixed(place);
  return Number(text.split(".")[1] ?? "0");
};

const generateDecimalAddSub = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as NumericRuleOptions;
  const decimalPlaces = options.decimalPlaces ?? 1;
  const operators = [
    ...(options.allowAdd ? ["+"] : []),
    ...(options.allowSub ? ["-"] : []),
  ];
  for (let attempts = 0; attempts < 500; attempts += 1) {
    const a = decimalValue(
      random,
      getNumericRangeValue(options.minA, 1),
      getNumericRangeValue(options.maxA, 9),
      decimalPlaces,
    );
    const b = decimalValue(
      random,
      getNumericRangeValue(options.minB, 1),
      getNumericRangeValue(options.maxB, 9),
      decimalPlaces,
    );
    const operator = random.pick(operators);
    const result = applyIntegerOperator(a, b, operator);
    if (operator === "-" && result < 0) continue;
    const aDigit = decimalDigit(a, decimalPlaces);
    const bDigit = decimalDigit(b, decimalPlaces);
    if (options.enforceCarry && operator === "+" && aDigit + bDigit < 10)
      continue;
    if (options.forbidCarry && operator === "+" && aDigit + bDigit >= 10)
      continue;
    if (options.enforceBorrow && operator === "-" && aDigit < bDigit) {
      return createProblem({
        chapter,
        left: formatDecimal(a),
        operator,
        right: formatDecimal(b),
        result: formatDecimal(result),
        layoutMode,
        answerMode,
        random,
      });
    }
    if (options.forbidBorrow && operator === "-" && aDigit < bDigit) continue;
    if (decimalPlacesOf(result) > decimalPlaces) continue;

    return createProblem({
      chapter,
      left: formatDecimal(a),
      operator,
      right: formatDecimal(b),
      result: formatDecimal(result),
      layoutMode,
      answerMode,
      random,
    });
  }

  return createProblem({
    chapter,
    left: "1.2",
    operator: "+",
    right: "2.3",
    result: "3.5",
    layoutMode,
    answerMode,
    random,
  });
};

const generateMulDiv = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as NumericRuleOptions;
  const operators = [
    ...(options.allowMul ? ["*"] : []),
    ...(options.allowDiv ? ["/"] : []),
  ];

  for (let attempts = 0; attempts < 500; attempts += 1) {
    const operator = random.pick(operators);
    if (operator === "*") {
      const a = random.int(
        getNumericRangeValue(options.minA, 1),
        getNumericRangeValue(options.maxA, 9),
      );
      const b = random.int(
        getNumericRangeValue(options.minB, 1),
        getNumericRangeValue(options.maxB, 9),
      );
      return createProblem({
        chapter,
        left: String(a),
        operator,
        right: String(b),
        result: String(a * b),
        layoutMode,
        answerMode,
        random,
      });
    }

    const divisorMin = getNumericRangeValue(options.minB, 1);
    const divisorMax = getNumericRangeValue(options.maxB, 9);
    const quotientMin = 1;
    const quotientMax = Math.max(
      2,
      Math.floor(getNumericRangeValue(options.maxA, 99) / divisorMin),
    );
    const { dividend, divisor, quotient } = numberToFactorPair(
      random,
      quotientMin,
      Math.min(quotientMax, 999),
      divisorMin,
      divisorMax,
    );
    if (
      dividend < getNumericRangeValue(options.minA, 1) ||
      dividend > getNumericRangeValue(options.maxA, 9999)
    )
      continue;
    return createProblem({
      chapter,
      left: String(dividend),
      operator,
      right: String(divisor),
      result: String(quotient),
      layoutMode,
      answerMode,
      random,
    });
  }

  return createProblem({
    chapter,
    left: "12",
    operator: "÷",
    right: "3",
    result: "4",
    layoutMode,
    answerMode,
    random,
  });
};

const integerOperators = (options: NumericRuleOptions) => {
  return [
    ...(options.allowAdd ? ["+"] : []),
    ...(options.allowSub ? ["-"] : []),
    ...(options.allowMul ? ["*"] : []),
    ...(options.allowDiv ? ["/"] : []),
  ];
};

const renderMixedExpression = (
  parts: string[],
  operators: string[],
  useParentheses: boolean,
) => {
  const rendered = parts
    .map((part, index) => {
      if (index === 0) return part;
      return `${OP_SYMBOL[operators[index - 1]]}${part}`;
    })
    .join("");
  if (!useParentheses || parts.length < 3) {
    return rendered;
  }
  return `(${parts[0]}${OP_SYMBOL[operators[0]]}${parts[1]})${OP_SYMBOL[operators[1]]}${parts[2]}`;
};

const evaluateMixed = (
  values: number[],
  operators: string[],
  useParentheses: boolean,
) => {
  if (values.length === 2) {
    return applyIntegerOperator(values[0], values[1], operators[0]);
  }
  if (useParentheses) {
    const first = applyIntegerOperator(values[0], values[1], operators[0]);
    return applyIntegerOperator(first, values[2], operators[1]);
  }
  const [a, b, c] = values;
  const [op1, op2] = operators;
  const high = ["*", "/"];
  if (high.includes(op1) && !high.includes(op2)) {
    return applyIntegerOperator(applyIntegerOperator(a, b, op1), c, op2);
  }
  if (!high.includes(op1) && high.includes(op2)) {
    return applyIntegerOperator(a, applyIntegerOperator(b, c, op2), op1);
  }
  return applyIntegerOperator(applyIntegerOperator(a, b, op1), c, op2);
};

const generateMixedInteger = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as NumericRuleOptions;
  const operators = integerOperators(options);
  const steps = options.steps ?? 2;
  const useParentheses = Boolean(
    options.allowParentheses && random.chance(0.5),
  );
  for (let attempts = 0; attempts < 1000; attempts += 1) {
    const values = Array.from({ length: steps }, () =>
      random.int(
        getNumericRangeValue(options.minA, 1),
        getNumericRangeValue(options.maxA, 99),
      ),
    );
    const ops = Array.from({ length: steps - 1 }, () => random.pick(operators));

    if (ops.includes("/") && chapter.grade <= 4) {
      for (let index = 0; index < ops.length; index += 1) {
        if (ops[index] === "/") {
          const quotient = random.int(2, 9);
          const divisor = random.int(2, 9);
          values[index] = quotient * divisor;
          values[index + 1] = divisor;
        }
      }
    }

    const result = evaluateMixed(values, ops, useParentheses);
    if (!Number.isFinite(result) || !Number.isInteger(result) || result < 0)
      continue;
    if (options.maxResult !== undefined && result > options.maxResult) continue;
    const parts = values.map(String);
    const expression = renderMixedExpression(parts, ops, useParentheses);
    return {
      id: `${chapter.value}-${expression}-${result}-${Math.round(random.next() * 1e6)}`,
      chapterId: chapter.value,
      chapterLabel: chapter.label,
      layoutMode,
      answerMode,
      expression: `${expression}=`,
      answer: String(result),
      left: expression,
      operator: "=",
      right: "",
      verticalRows: buildVerticalRowsFromExpression(expression),
      verticalAnswer: "",
      isVerticalNative: true,
    };
  }

  return {
    id: `${chapter.value}-fallback`,
    chapterId: chapter.value,
    chapterLabel: chapter.label,
    layoutMode,
    answerMode,
    expression: "6+3−2=",
    answer: "7",
    left: "6+3−2",
    operator: "=",
    right: "",
    verticalRows: buildVerticalRowsFromExpression("6+3−2"),
    verticalAnswer: "",
    isVerticalNative: true,
  };
};

const randomFraction = (random: Random, options: FractionRuleOptions) => {
  const denominator = random.int(2, options.maxDenominator ?? 12);
  const numerator = random.int(
    1,
    Math.min(options.maxNumerator ?? denominator - 1, denominator - 1),
  );
  return simplifyFraction({ numerator, denominator });
};

const fractionAddSub = (left: Fraction, right: Fraction, operator: string) => {
  const common = lcm(left.denominator, right.denominator);
  const leftNumerator = left.numerator * (common / left.denominator);
  const rightNumerator = right.numerator * (common / right.denominator);
  return simplifyFraction({
    numerator:
      operator === "+"
        ? leftNumerator + rightNumerator
        : leftNumerator - rightNumerator,
    denominator: common,
  });
};

const fractionMulDiv = (left: Fraction, right: Fraction, operator: string) => {
  if (operator === "*") {
    return simplifyFraction({
      numerator: left.numerator * right.numerator,
      denominator: left.denominator * right.denominator,
    });
  }
  return simplifyFraction({
    numerator: left.numerator * right.denominator,
    denominator: left.denominator * right.numerator,
  });
};

const generateFractionSameDenominator = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as FractionRuleOptions;
  const operator = random.pick([
    ...(options.allowAdd ? ["+"] : []),
    ...(options.allowSub ? ["-"] : []),
  ]);

  for (let attempts = 0; attempts < 500; attempts += 1) {
    const denominator = random.int(2, options.maxDenominator ?? 12);
    const numeratorA = random.int(1, denominator - 1);
    const numeratorB = random.int(1, denominator - 1);
    if (operator === "-" && numeratorA < numeratorB) continue;
    const left = { numerator: numeratorA, denominator };
    const right = { numerator: numeratorB, denominator };
    const result = fractionAddSub(left, right, operator);
    return createProblem({
      chapter,
      left: fractionToString(left),
      operator,
      right: fractionToString(right),
      result: fractionToString(result),
      layoutMode,
      answerMode,
      random,
      forceHorizontal: true,
    });
  }

  return createProblem({
    chapter,
    left: "3/7",
    operator: "+",
    right: "2/7",
    result: "5/7",
    layoutMode,
    answerMode,
    random,
    forceHorizontal: true,
  });
};

const generateFractionAddSub = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as FractionRuleOptions;
  const operator = random.pick([
    ...(options.allowAdd ? ["+"] : []),
    ...(options.allowSub ? ["-"] : []),
  ]);

  for (let attempts = 0; attempts < 500; attempts += 1) {
    const left = randomFraction(random, options);
    const right = randomFraction(random, options);
    const result = fractionAddSub(left, right, operator);
    if (operator === "-" && result.numerator < 0) continue;
    return createProblem({
      chapter,
      left: fractionToString(left),
      operator,
      right: fractionToString(right),
      result: fractionToString(result),
      layoutMode,
      answerMode,
      random,
      forceHorizontal: true,
    });
  }

  return createProblem({
    chapter,
    left: "3/5",
    operator: "-",
    right: "4/15",
    result: "1/3",
    layoutMode,
    answerMode,
    random,
    forceHorizontal: true,
  });
};

const decimalOperand = (random: Random) => {
  const tenths = random.int(1, 20);
  return Number((tenths / 10).toFixed(1));
};

const mixedFractionOperand = (random: Random, options: FractionRuleOptions) => {
  const bucket: string[] = ["fraction"];
  if (options.includeIntegers) bucket.push("integer");
  if (options.includeDecimals) bucket.push("decimal");
  const kind = random.pick(bucket);
  if (kind === "integer") {
    const value = random.int(1, 20);
    return { text: String(value), value };
  }
  if (kind === "decimal") {
    const value = decimalOperand(random);
    return { text: formatDecimal(value), value };
  }
  const fraction = randomFraction(random, options);
  return {
    text: fractionToString(fraction),
    value: fraction.numerator / fraction.denominator,
  };
};

const generateFractionMulDiv = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as FractionRuleOptions;
  const operator = random.pick([
    ...(options.allowMul ? ["*"] : []),
    ...(options.allowDiv ? ["/"] : []),
  ]);
  for (let attempts = 0; attempts < 500; attempts += 1) {
    const left = randomFraction(random, options);
    const right =
      options.includeIntegers && random.chance(0.35)
        ? simplifyFraction({ numerator: random.int(2, 12), denominator: 1 })
        : randomFraction(random, options);
    if (operator === "/" && right.numerator === 0) continue;
    const result = fractionMulDiv(left, right, operator);
    return createProblem({
      chapter,
      left: fractionToString(left),
      operator,
      right: fractionToString(right),
      result: fractionToString(result),
      layoutMode,
      answerMode,
      random,
      forceHorizontal: true,
    });
  }

  return createProblem({
    chapter,
    left: "7/5",
    operator: "×",
    right: "11/42",
    result: "11/30",
    layoutMode,
    answerMode,
    random,
    forceHorizontal: true,
  });
};

const generateDecimalMulDiv = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as NumericRuleOptions;
  const operator = random.pick([
    ...(options.allowMul ? ["*"] : []),
    ...(options.allowDiv ? ["/"] : []),
  ]);
  const places = options.decimalPlaces ?? 2;
  for (let attempts = 0; attempts < 500; attempts += 1) {
    if (operator === "*") {
      const a = decimalValue(
        random,
        getNumericRangeValue(options.minA, 1),
        getNumericRangeValue(options.maxA, 20),
        places,
      );
      const b = decimalValue(
        random,
        getNumericRangeValue(options.minB, 1),
        getNumericRangeValue(options.maxB, 20),
        1,
      );
      const result = a * b;
      return createProblem({
        chapter,
        left: formatDecimal(a),
        operator,
        right: formatDecimal(b),
        result: formatDecimal(result),
        layoutMode,
        answerMode,
        random,
      });
    }

    const divisor = decimalValue(
      random,
      1,
      getNumericRangeValue(options.maxB, 10),
      1,
    );
    const quotient = decimalValue(random, 1, 20, 1);
    const dividend = Number((divisor * quotient).toFixed(3));
    return createProblem({
      chapter,
      left: formatDecimal(dividend),
      operator,
      right: formatDecimal(divisor),
      result: formatDecimal(quotient),
      layoutMode,
      answerMode,
      random,
    });
  }

  return createProblem({
    chapter,
    left: "6.4",
    operator: "÷",
    right: "0.8",
    result: "8",
    layoutMode,
    answerMode,
    random,
  });
};

const generateDecimalMixed = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as NumericRuleOptions;
  const ops = integerOperators(options);
  for (let attempts = 0; attempts < 1000; attempts += 1) {
    const values = Array.from({ length: 3 }, () =>
      decimalValue(
        random,
        getNumericRangeValue(options.minA, 1),
        getNumericRangeValue(options.maxA, 20),
        1,
      ),
    );
    const operators = [random.pick(ops), random.pick(ops)];
    if (operators.includes("/")) {
      values[0] = Number((values[1] * values[2]).toFixed(2));
    }
    const result = evaluateMixed(values, operators, false);
    if (!Number.isFinite(result) || result < 0) continue;
    return {
      id: `${chapter.value}-${Math.round(random.next() * 1e6)}`,
      chapterId: chapter.value,
      chapterLabel: chapter.label,
      layoutMode,
      answerMode,
      expression: `${formatDecimal(values[0])}${OP_SYMBOL[operators[0]]}${formatDecimal(values[1])}${OP_SYMBOL[operators[1]]}${formatDecimal(values[2])}=`,
      answer: formatDecimal(result),
      left: `${formatDecimal(values[0])}${OP_SYMBOL[operators[0]]}${formatDecimal(values[1])}${OP_SYMBOL[operators[1]]}${formatDecimal(values[2])}`,
      operator: "=",
      right: "",
      verticalRows: buildVerticalRowsFromExpression(
        `${formatDecimal(values[0])}${OP_SYMBOL[operators[0]]}${formatDecimal(values[1])}${OP_SYMBOL[operators[1]]}${formatDecimal(values[2])}`,
      ),
      verticalAnswer: "",
      isVerticalNative: true,
    };
  }
  return {
    id: `${chapter.value}-fallback`,
    chapterId: chapter.value,
    chapterLabel: chapter.label,
    layoutMode,
    answerMode,
    expression: "2.4×3÷0.6=",
    answer: "12",
    left: "2.4×3÷0.6",
    operator: "=",
    right: "",
    verticalRows: buildVerticalRowsFromExpression("2.4×3÷0.6"),
    verticalAnswer: "",
    isVerticalNative: true,
  };
};

const generateFractionMixed = (
  random: Random,
  chapter: ChapterDefinition,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  const options = (chapter.options ?? {}) as FractionRuleOptions;
  const operatorPool = [
    ...(options.allowAdd ? ["+"] : []),
    ...(options.allowSub ? ["-"] : []),
    ...(options.allowMul ? ["*"] : []),
    ...(options.allowDiv ? ["/"] : []),
  ];
  for (let attempts = 0; attempts < 1000; attempts += 1) {
    const left = mixedFractionOperand(random, options);
    const middle = mixedFractionOperand(random, options);
    const right = mixedFractionOperand(random, options);
    const op1 = random.pick(operatorPool);
    const op2 = random.pick(operatorPool);
    const expression = `(${left.text}${OP_SYMBOL[op1]}${middle.text})${OP_SYMBOL[op2]}${right.text}`;
    const interim = applyIntegerOperator(left.value, middle.value, op1);
    const result = applyIntegerOperator(interim, right.value, op2);
    if (!Number.isFinite(result) || result < 0) continue;
    return {
      id: `${chapter.value}-${Math.round(random.next() * 1e6)}`,
      chapterId: chapter.value,
      chapterLabel: chapter.label,
      layoutMode,
      answerMode,
      expression: `${expression}=`,
      answer: formatDecimal(result),
      left: expression,
      operator: "=",
      right: "",
      verticalRows: buildVerticalRowsFromExpression(expression),
      verticalAnswer: "",
      isVerticalNative: true,
    };
  }
  return {
    id: `${chapter.value}-fallback`,
    chapterId: chapter.value,
    chapterLabel: chapter.label,
    layoutMode,
    answerMode,
    expression: "(3/5+6/7)×12=",
    answer: "17.3143",
    left: "(3/5+6/7)×12",
    operator: "=",
    right: "",
    verticalRows: buildVerticalRowsFromExpression("(3/5+6/7)×12"),
    verticalAnswer: "",
    isVerticalNative: true,
  };
};

const generateFromChapter = (
  chapter: ChapterDefinition,
  random: Random,
  layoutMode: LayoutMode,
  answerMode: AnswerMode,
) => {
  switch (chapter.ruleKind) {
    case "add-sub":
      return generateAddSub(random, chapter, layoutMode, answerMode);
    case "mul-div":
      return generateMulDiv(random, chapter, layoutMode, answerMode);
    case "mixed-integer":
      return generateMixedInteger(random, chapter, layoutMode, answerMode);
    case "decimal-add-sub":
      return generateDecimalAddSub(random, chapter, layoutMode, answerMode);
    case "decimal-mul-div":
      return generateDecimalMulDiv(random, chapter, layoutMode, answerMode);
    case "decimal-mixed":
      return generateDecimalMixed(random, chapter, layoutMode, answerMode);
    case "fraction-same-denominator":
      return generateFractionSameDenominator(
        random,
        chapter,
        layoutMode,
        answerMode,
      );
    case "fraction-add-sub":
      return generateFractionAddSub(random, chapter, layoutMode, answerMode);
    case "fraction-mul-div":
      return generateFractionMulDiv(random, chapter, layoutMode, answerMode);
    case "fraction-mixed":
      return generateFractionMixed(random, chapter, layoutMode, answerMode);
    default:
      return generateAddSub(random, chapter, layoutMode, answerMode);
  }
};

const gradeLabel = (grade: GradeValue) =>
  gradeDefinitions.find((item) => item.value === grade)?.label ?? "";

export const chaptersForGrade = (grade: GradeValue) => {
  return gradeDefinitions.find((item) => item.value === grade)?.chapters ?? [];
};

export const resolveSelectedChapters = (
  grade: GradeValue,
  chapterIds: number[],
) => {
  const available = chaptersForGrade(grade);
  const selected = available.filter((item) => chapterIds.includes(item.value));
  return selected.length > 0 ? selected : available.slice(0, 1);
};

const chapterPoolFor = (chapter: ChapterDefinition) => {
  if (chapter.label !== "综合练习") {
    return [chapter];
  }
  const gradeChapters = chaptersForGrade(chapter.grade);
  return gradeChapters.filter(
    (item) => item.order <= (chapter.mixUntilOrder ?? chapter.order - 1),
  );
};

export const buildWorksheetPages = (
  config: WorksheetConfig,
): WorksheetPage[] => {
  const selectedChapters = resolveSelectedChapters(
    config.grade,
    config.chapterIds,
  );
  const random = new Random(config.seed);
  const problems: StandardProblem[] = [];
  const seen = new Set<string>();
  const chapterTitle =
    selectedChapters.length === 1 ? selectedChapters[0].label : "计算小达人";
  let attempts = 0;

  while (
    problems.length < config.totalCount &&
    attempts < config.totalCount * 80
  ) {
    attempts += 1;
    const selected = random.pick(selectedChapters);
    const chapter = random.pick(chapterPoolFor(selected));
    const problem = generateFromChapter(
      chapter,
      random,
      config.layoutMode,
      config.answerMode,
    );
    const signature = `${chapter.value}-${problem.expression}-${problem.answer}`;
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    problems.push(problem);
  }

  while (problems.length < config.totalCount) {
    const selected = random.pick(selectedChapters);
    const chapter = random.pick(chapterPoolFor(selected));
    problems.push(
      generateFromChapter(
        chapter,
        random,
        config.layoutMode,
        config.answerMode,
      ),
    );
  }

  const pages: WorksheetPage[] = [];
  for (let index = 0; index < problems.length; index += config.pageSize) {
    pages.push({
      index: pages.length + 1,
      title: chapterTitle,
      problems: problems.slice(index, index + config.pageSize),
    });
  }
  return pages;
};

export const chapterSelectionError = (
  grade: GradeValue,
  chapterIds: number[],
) => {
  const invalid = chapterIds.filter(
    (id) => chapterMap.get(id)?.grade !== grade,
  );
  if (invalid.length > 0) {
    return `章节选择必须限定在${gradeLabel(grade)}范围内。`;
  }
  return "";
};
