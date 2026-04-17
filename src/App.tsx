import { useMemo, useState } from "react";
import { gradeDefinitions } from "./data/chapters";
import {
  buildWorksheetPages,
  chapterSelectionError,
  chaptersForGrade,
} from "./lib/worksheet";
import type { GradeValue, StandardProblem, WorksheetConfig } from "./types";

const layoutDefaults = {
  horizontal: {
    pageSize: 120,
    columns: 4,
  },
  vertical: {
    pageSize: 30,
    columns: 3,
  },
} as const;

const defaultConfig: WorksheetConfig = {
  grade: 1,
  chapterIds: [200],
  layoutMode: "horizontal",
  answerMode: "oral",
  totalCount: 120,
  pageSize: layoutDefaults.horizontal.pageSize,
  columns: layoutDefaults.horizontal.columns,
  showAnswers: false,
  seed: Date.now(),
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const readInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function App() {
  const [config, setConfig] = useState<WorksheetConfig>(defaultConfig);
  const availableChapters = useMemo(
    () => chaptersForGrade(config.grade),
    [config.grade],
  );
  const selectionError = chapterSelectionError(config.grade, config.chapterIds);
  const pages = useMemo(() => buildWorksheetPages(config), [config]);

  const updateConfig = <K extends keyof WorksheetConfig>(
    key: K,
    value: WorksheetConfig[K],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const onGradeChange = (grade: GradeValue) => {
    const nextChapters = chaptersForGrade(grade);
    setConfig((current) => ({
      ...current,
      grade,
      chapterIds: nextChapters[0] ? [nextChapters[0].value] : [],
      seed: Date.now(),
    }));
  };

  const toggleChapter = (chapterId: number) => {
    setConfig((current) => {
      const next = current.chapterIds.includes(chapterId)
        ? current.chapterIds.filter((item) => item !== chapterId)
        : [...current.chapterIds, chapterId];
      return {
        ...current,
        chapterIds: next.length > 0 ? next : [chapterId],
        seed: Date.now(),
      };
    });
  };

  const onLayoutChange = (layoutMode: WorksheetConfig["layoutMode"]) => {
    setConfig((current) => ({
      ...current,
      layoutMode,
      pageSize: layoutDefaults[layoutMode].pageSize,
      columns: layoutDefaults[layoutMode].columns,
    }));
  };

  const normalizedPageSize = clamp(config.pageSize, 1, 120);
  const normalizedColumns = clamp(config.columns, 1, 6);

  const statusText = `${pages.length} 页 / ${config.totalCount} 题 / 每页 ${normalizedPageSize} 题`;

  return (
    <div className="app-shell">
      <aside className="control-panel">
        <div className="panel-header">
          <p className="eyebrow">Math Whiz</p>
          <h1>数学计算小达人</h1>
          <p className="panel-copy">按年级和知识章节生成可打印的练习卷</p>
        </div>

        <section className="control-group">
          <h2>年级</h2>
          <div className="grade-grid">
            {gradeDefinitions.map((grade) => (
              <button
                key={grade.value}
                type="button"
                className={
                  grade.value === config.grade ? "chip active" : "chip"
                }
                onClick={() => onGradeChange(grade.value)}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </section>

        <section className="control-group">
          <div className="group-title-row">
            <h2>知识大纲章节</h2>
            <span className="hint">同年级可多选</span>
          </div>
          <div className="chapter-list">
            {availableChapters.map((chapter) => {
              const checked = config.chapterIds.includes(chapter.value);
              return (
                <label
                  key={chapter.value}
                  className={checked ? "chapter-card active" : "chapter-card"}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChapter(chapter.value)}
                  />
                  <span className="chapter-meta">
                    <strong>{chapter.label}</strong>
                    {chapter.tip ? (
                      <small>{chapter.tip}</small>
                    ) : (
                      <small>本年级已学章节混合练习</small>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {selectionError ? (
            <p className="error-text">{selectionError}</p>
          ) : null}
        </section>

        <section className="control-group two-column">
          <div>
            <h2>排版</h2>
            <div className="segmented">
              <button
                type="button"
                className={
                  config.layoutMode === "horizontal" ? "chip active" : "chip"
                }
                onClick={() => onLayoutChange("horizontal")}
              >
                横式
              </button>
              <button
                type="button"
                className={
                  config.layoutMode === "vertical" ? "chip active" : "chip"
                }
                onClick={() => onLayoutChange("vertical")}
              >
                竖式
              </button>
            </div>
          </div>
          <div>
            <h2>答题方式</h2>
            <div className="segmented">
              <button
                type="button"
                className={
                  config.answerMode === "oral" ? "chip active" : "chip"
                }
                onClick={() => updateConfig("answerMode", "oral")}
              >
                口算
              </button>
              <button
                type="button"
                className={
                  config.answerMode === "blank" ? "chip active" : "chip"
                }
                onClick={() => updateConfig("answerMode", "blank")}
              >
                填空
              </button>
            </div>
          </div>
        </section>

        <section className="control-group metrics-grid">
          <label>
            <span>题目总数</span>
            <input
              type="number"
              min={1}
              max={240}
              value={config.totalCount}
              onChange={(event) =>
                updateConfig(
                  "totalCount",
                  clamp(readInt(event.target.value, 40), 1, 240),
                )
              }
            />
          </label>
          <label>
            <span>每页题数</span>
            <input
              type="number"
              min={1}
              max={120}
              value={config.pageSize}
              onChange={(event) =>
                updateConfig(
                  "pageSize",
                  clamp(
                    readInt(
                      event.target.value,
                      layoutDefaults[config.layoutMode].pageSize,
                    ),
                    1,
                    120,
                  ),
                )
              }
            />
          </label>
          <label>
            <span>列数</span>
            <input
              type="number"
              min={1}
              max={6}
              value={config.columns}
              onChange={(event) =>
                updateConfig(
                  "columns",
                  clamp(
                    readInt(
                      event.target.value,
                      layoutDefaults[config.layoutMode].columns,
                    ),
                    1,
                    6,
                  ),
                )
              }
            />
          </label>
        </section>

        <section className="control-group">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={config.showAnswers}
              onChange={(event) =>
                updateConfig("showAnswers", event.target.checked)
              }
            />
            <span>显示答案</span>
          </label>
          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => updateConfig("seed", Date.now())}
            >
              重新生成
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => window.print()}
            >
              打印 / 预览
            </button>
          </div>
        </section>

        <section className="control-group">
          <p className="status-card">{statusText}</p>
          <p className="hint-block">
            页面会按“总题数 + 每页题数”自动分页。打印时仅输出右侧练习页。
          </p>
        </section>
      </aside>

      <main className="preview-shell">
        <div className="preview-header">
          <div>
            <p className="eyebrow">Worksheet Preview</p>
            <h2>打印预览</h2>
          </div>
          <p>{statusText}</p>
        </div>
        <div className="page-stack">
          {pages.map((page) => (
            <WorksheetPageView
              key={page.index}
              title={page.title}
              index={page.index}
              problems={page.problems}
              showAnswers={config.showAnswers}
              columns={normalizedColumns}
              layoutMode={config.layoutMode}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function WorksheetPageView({
  title,
  index,
  problems,
  showAnswers,
  columns,
  layoutMode,
}: {
  title: string;
  index: number;
  problems: StandardProblem[];
  showAnswers: boolean;
  columns: number;
  layoutMode: WorksheetConfig["layoutMode"];
}) {
  const displayRows = useMemo(() => {
    const complexityOf = (problem: StandardProblem) => {
      if ((problem.verticalRows?.length ?? 0) > 0) {
        return problem.verticalRows?.length ?? 0;
      }
      if (problem.operator === "=" || !problem.right) {
        return 3;
      }
      return 2;
    };

    const sorted = [...problems].sort(
      (left, right) => complexityOf(right) - complexityOf(left),
    );
    const rowsList: StandardProblem[][] = [];
    for (let cursor = 0; cursor < sorted.length; cursor += columns) {
      rowsList.push(sorted.slice(cursor, cursor + columns));
    }
    return rowsList;
  }, [columns, problems]);

  const rowCount = displayRows.length;
  const density =
    layoutMode === "horizontal"
      ? rowCount >= 24
        ? "compact"
        : "normal"
      : rowCount >= 10
        ? "compact"
        : "normal";
  const worksheetDensityStyle =
    layoutMode === "horizontal"
      ? rowCount >= 24
        ? ({
            "--problem-font-size": "1.14rem",
            "--problem-line-height": "1.02",
            "--problem-row-gap": "2px",
            "--problem-col-gap": "10px",
          } as React.CSSProperties)
        : ({
            "--problem-font-size": "1.2rem",
            "--problem-line-height": "1.2",
            "--problem-row-gap": "8px",
            "--problem-col-gap": "14px",
          } as React.CSSProperties)
      : ({
          "--problem-font-size": "1.56rem",
          "--problem-line-height": "1.06",
          "--problem-row-gap": "10px",
          "--problem-col-gap": "14px",
        } as React.CSSProperties);

  return (
    <section
      className="worksheet-page"
      style={worksheetDensityStyle}
      data-layout={layoutMode}
      data-density={density}
    >
      <header className="worksheet-header">
        <h2>{title}</h2>
        <div className="worksheet-meta">
          <span className="meta-writing">
            日期：
            <span className="meta-line date-line" />
          </span>
          <span className="meta-writing">
            得分：
            <span className="meta-line score-line" />/{problems.length}
          </span>
        </div>
      </header>

      <div
        className="problem-rows"
        style={{
          gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        }}
      >
        {displayRows.map((rowProblems, rowIndex) => (
          <div
            key={`${title}-${index}-row-${rowIndex}`}
            className="problem-row"
          >
            <div className="row-index">{rowIndex + 1}</div>
            <div
              className={
                layoutMode === "vertical"
                  ? "problem-grid vertical"
                  : "problem-grid horizontal"
              }
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {rowProblems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  showAnswers={showAnswers}
                  layoutMode={layoutMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="worksheet-footer">
        <span className="meta-page">第 {index} 页</span>
      </footer>
    </section>
  );
}

function ProblemCard({
  problem,
  showAnswers,
  layoutMode,
}: {
  problem: StandardProblem;
  showAnswers: boolean;
  layoutMode: WorksheetConfig["layoutMode"];
}) {
  const renderAsVertical =
    layoutMode === "vertical" &&
    problem.isVerticalNative &&
    (problem.verticalRows?.length ?? 0) >= 2;

  return (
    <article
      className={
        renderAsVertical ? "problem-card vertical" : "problem-card horizontal"
      }
    >
      {renderAsVertical ? (
        <div className="vertical-problem">
          {problem.verticalRows?.map((row, rowIndex) => (
            <div
              key={`${problem.id}-row-${rowIndex}`}
              className={
                row.operator ? "vertical-row bottom" : "vertical-row top"
              }
            >
              <span
                className={row.operator ? "operator" : "operator placeholder"}
              >
                {row.operator ?? "+"}
              </span>
              <span>
                {row.value ||
                  (showAnswers &&
                  problem.answerMode === "blank" &&
                  rowIndex > 0 &&
                  problem.blankTarget === "right" ? (
                    <MathText text={problem.answer} />
                  ) : showAnswers &&
                    problem.answerMode === "blank" &&
                    rowIndex === 0 &&
                    problem.blankTarget === "left" ? (
                    <MathText text={problem.answer} />
                  ) : (
                    <span className="blank-slot" />
                  ))}
              </span>
            </div>
          ))}
          <div className="vertical-line" />
          <div className="vertical-row result">
            <span className="operator equals-mark">=</span>
            {problem.answerMode === "oral" || !problem.verticalAnswer ? (
              <>
                {showAnswers ? (
                  <span className="filled-answer">
                    <MathText text={problem.answer} />
                  </span>
                ) : (
                  <span className="blank-slot result-slot" />
                )}
              </>
            ) : (
              <MathText text={problem.verticalAnswer} />
            )}
          </div>
        </div>
      ) : (
        <div className="horizontal-problem">
          <span className="problem-expression">
            <HorizontalExpression problem={problem} showAnswers={showAnswers} />
          </span>
        </div>
      )}
    </article>
  );
}

function HorizontalExpression({
  problem,
  showAnswers,
}: {
  problem: StandardProblem;
  showAnswers: boolean;
}) {
  const answerSlot = showAnswers ? (
    <span className="filled-answer inline-answer-fill">
      <MathText text={problem.answer} />
    </span>
  ) : (
    <span className="blank-slot inline-slot" />
  );
  const renderCells = (cells: React.ReactNode[]) => {
    const startColumn = 8 - cells.length;
    return cells.map((cell, index) => (
      <span
        key={`${problem.id}-cell-${index}`}
        className={
          index === cells.length - 1
            ? "expr-cell answer"
            : cell === "="
              ? "expr-cell equal"
              : cell === "+" || cell === "−" || cell === "×" || cell === "÷"
                ? "expr-cell operator"
                : "expr-cell operand"
        }
        style={{ gridColumn: startColumn + index }}
      >
        {typeof cell === "string" ? <MathText text={cell} /> : cell}
      </span>
    ));
  };

  if (!problem.operator || !problem.left) {
    return <>{renderCells([problem.expression, "=", answerSlot])}</>;
  }

  if (problem.operator === "=" || !problem.right) {
    return (
      <>
        {renderCells([
          ...(problem.expression.endsWith("=")
            ? problem.expression.slice(0, -1)
            : problem.expression
          )
            .split(/([+−×÷])/)
            .filter(Boolean),
          "=",
          answerSlot,
        ])}
      </>
    );
  }

  if (problem.answerMode === "oral") {
    return (
      <>
        {renderCells([
          problem.left,
          problem.operator,
          problem.right,
          "=",
          answerSlot,
        ])}
      </>
    );
  }

  if (problem.blankTarget === "left") {
    return (
      <>
        {renderCells([
          answerSlot,
          problem.operator,
          problem.right,
          "=",
          problem.answerMode === "blank"
            ? problem.expression.split("=")[1]
            : "",
        ])}
      </>
    );
  }

  if (problem.blankTarget === "right") {
    return (
      <>
        {renderCells([
          problem.left,
          problem.operator,
          answerSlot,
          "=",
          problem.expression.split("=")[1],
        ])}
      </>
    );
  }

  return (
    <>
      {renderCells([
        problem.left,
        problem.operator,
        problem.right,
        "=",
        answerSlot,
      ])}
    </>
  );
}

function MathText({ text }: { text: string }) {
  const parts = text.split(/(\d+\/\d+)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^(\d+)\/(\d+)$/);
        if (!match) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }
        return (
          <FractionView
            key={`${part}-${index}`}
            numerator={match[1]}
            denominator={match[2]}
          />
        );
      })}
    </>
  );
}

function FractionView({
  numerator,
  denominator,
}: {
  numerator: string;
  denominator: string;
}) {
  return (
    <span className="fraction" aria-label={`${numerator}分之${denominator}`}>
      <span className="fraction-top">{numerator}</span>
      <span className="fraction-line" />
      <span className="fraction-bottom">{denominator}</span>
    </span>
  );
}

export default App;
