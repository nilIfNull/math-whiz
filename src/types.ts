export type GradeValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type LayoutMode = "horizontal" | "vertical";
export type AnswerMode = "oral" | "blank";
export type BlankTarget = "left" | "right" | "result";
export type RuleKind =
  | "add-sub"
  | "mul-div"
  | "mixed-integer"
  | "decimal-add-sub"
  | "decimal-mul-div"
  | "decimal-mixed"
  | "fraction-same-denominator"
  | "fraction-add-sub"
  | "fraction-mul-div"
  | "fraction-mixed";

export interface ChapterDefinition {
  label: string;
  tip: string;
  value: number;
  grade: GradeValue;
  order: number;
  ruleKind: RuleKind;
  mixUntilOrder?: number;
  options?: RuleOptions;
}

export interface GradeDefinition {
  label: string;
  value: GradeValue;
  chapters: ChapterDefinition[];
}

export interface WorksheetConfig {
  grade: GradeValue;
  chapterIds: number[];
  layoutMode: LayoutMode;
  answerMode: AnswerMode;
  totalCount: number;
  pageSize: number;
  columns: number;
  showAnswers: boolean;
  seed: number;
}

export interface StandardProblem {
  id: string;
  chapterId: number;
  chapterLabel: string;
  layoutMode: LayoutMode;
  answerMode: AnswerMode;
  expression: string;
  answer: string;
  blankTarget?: BlankTarget;
  left?: string;
  operator?: string;
  right?: string;
  verticalTop?: string;
  verticalBottom?: string;
  verticalResult?: string;
  verticalOperator?: string;
  verticalRows?: Array<{
    operator?: string;
    value: string;
  }>;
  verticalAnswer?: string;
  isVerticalNative: boolean;
}

export interface WorksheetPage {
  index: number;
  title: string;
  problems: StandardProblem[];
}

export interface NumericRuleOptions {
  minA?: number;
  maxA?: number;
  minB?: number;
  maxB?: number;
  allowAdd?: boolean;
  allowSub?: boolean;
  allowMul?: boolean;
  allowDiv?: boolean;
  steps?: 1 | 2 | 3;
  enforceCarry?: boolean;
  forbidCarry?: boolean;
  enforceBorrow?: boolean;
  forbidBorrow?: boolean;
  allowRemainder?: boolean;
  digitsA?: number;
  digitsB?: number;
  decimalPlaces?: number;
  maxResult?: number;
  allowParentheses?: boolean;
}

export interface FractionRuleOptions {
  sameDenominator?: boolean;
  allowAdd?: boolean;
  allowSub?: boolean;
  allowMul?: boolean;
  allowDiv?: boolean;
  allowMixed?: boolean;
  maxDenominator?: number;
  maxNumerator?: number;
  includeIntegers?: boolean;
  includeDecimals?: boolean;
}

export type RuleOptions = NumericRuleOptions | FractionRuleOptions;
