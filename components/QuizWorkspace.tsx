"use client";

import { useMemo, useState } from "react";
import type { Exercise, GiftQuestion } from "@/lib/gift";

type Mode = "learn" | "test";
type AnswerMap = Record<string, string[]>;

type Props = {
  exercise: Exercise;
};

export default function QuizWorkspace({ exercise }: Props) {
  const [mode, setMode] = useState<Mode>("learn");
  const [cardIndex, setCardIndex] = useState(0);
  const [isBackVisible, setIsBackVisible] = useState(false);
  const [seed, setSeed] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);

  const testQuestions = useMemo(() => {
    return shuffleQuestions(exercise.questions, seed).map((question) => ({
      ...question,
      answers: shuffleQuestions(question.answers, seed + question.id.length),
    }));
  }, [exercise.questions, seed]);

  const currentQuestion = exercise.questions[cardIndex];
  const progress = ((cardIndex + 1) / exercise.questions.length) * 100;
  const score = useMemo(() => {
    return testQuestions.filter((question) => isQuestionCorrect(question, selectedAnswers[question.id] ?? [])).length;
  }, [selectedAnswers, testQuestions]);

  function moveCard(direction: number) {
    setCardIndex((current) => {
      const next = current + direction;
      return Math.min(Math.max(next, 0), exercise.questions.length - 1);
    });
    setIsBackVisible(false);
  }

  function restartTest() {
    setSeed((current) => current + 1);
    setSelectedAnswers({});
    setSubmitted(false);
  }

  function toggleAnswer(questionId: string, answerId: string) {
    if (submitted) return;

    setSelectedAnswers((current) => {
      const answers = current[questionId] ?? [];
      const nextAnswers = answers.includes(answerId)
        ? answers.filter((selected) => selected !== answerId)
        : [...answers, answerId];

      return {
        ...current,
        [questionId]: nextAnswers,
      };
    });
  }

  return (
    <div className="workspace">
      <aside className="panel">
        <div className="tabs" role="tablist" aria-label="Rezim">
          <button className={`tab ${mode === "learn" ? "active" : ""}`} onClick={() => setMode("learn")} type="button">
            Learning
          </button>
          <button className={`tab ${mode === "test" ? "active" : ""}`} onClick={() => setMode("test")} type="button">
            Test
          </button>
        </div>

        <div className="stats">
          <div className="stat">
            <span>Otazky</span>
            <strong>{exercise.questionCount}</strong>
          </div>
          <div className="stat">
            <span>Subory</span>
            <strong>{exercise.files.length}</strong>
          </div>
          <div className="stat">
            <span>Aktualny rezim</span>
            <strong>{mode === "learn" ? "Karticky" : "Test"}</strong>
          </div>
        </div>

        <h3 style={{ marginTop: 22 }}>GIFT subory</h3>
        <ul className="answer-list">
          {exercise.files.map((file) => (
            <li className="muted" key={file}>
              {file}
            </li>
          ))}
        </ul>
      </aside>

      <section>
        {mode === "learn" ? (
          <div className="learn-stack">
            <div className="progress" aria-label="Postup">
              <span style={{ width: `${progress}%` }} />
            </div>
            <article
              className="flashcard"
              onClick={() => setIsBackVisible((visible) => !visible)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsBackVisible((visible) => !visible);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flashcard-title">
                Karticka {cardIndex + 1} / {exercise.questions.length} · {currentQuestion.sourceFile}
              </div>
              <h2 className="question-text">{currentQuestion.text}</h2>

              {!isBackVisible ? (
                <ul className="answer-list">
                  {currentQuestion.answers.map((answer) => (
                    <li className="answer-row" key={answer.id}>
                      {answer.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <h3>Spravna odpoved</h3>
                  <ul className="answer-list">
                    {currentQuestion.answers
                      .filter((answer) => answer.isCorrect)
                      .map((answer) => (
                        <li className="answer-row correct" key={answer.id}>
                          {answer.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </article>
            <div className="flashcard-actions">
              <button className="button ghost" disabled={cardIndex === 0} onClick={() => moveCard(-1)} type="button">
                Predosla
              </button>
              <button className="button ghost" disabled={cardIndex === exercise.questions.length - 1} onClick={() => moveCard(1)} type="button">
                Dalsia
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="question-stack">
              {testQuestions.map((question, index) => {
                const selected = selectedAnswers[question.id] ?? [];
                const correct = isQuestionCorrect(question, selected);

                return (
                  <article className="question-card" key={question.id}>
                    <div className="question-heading">
                      <div>
                        <span className="badge">Otazka {index + 1}</span>
                        <h2 style={{ marginTop: 12 }}>{question.text}</h2>
                      </div>
                      {submitted ? <span className={`badge ${correct ? "ok" : "bad"}`}>{correct ? "Spravne" : "Zle"}</span> : null}
                    </div>

                    <ul className="answer-list">
                      {question.answers.map((answer) => {
                        const checked = selected.includes(answer.id);
                        const showCorrect = submitted && answer.isCorrect;
                        const showWrong = submitted && checked && !answer.isCorrect;

                        return (
                          <li className={`answer-row ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`} key={answer.id}>
                            <input
                              aria-label={answer.text}
                              checked={checked}
                              disabled={submitted}
                              onChange={() => toggleAnswer(question.id, answer.id)}
                              type="checkbox"
                            />
                            <span>{answer.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="result-bar">
              <div>
                <div className="score">{submitted ? `${score} / ${testQuestions.length} spravne` : "Test je pripraveny"}</div>
                <div className="muted">Otazky aj odpovede su nahodne zoradene.</div>
              </div>
              <div className="segmented">
                <button className="button ghost" onClick={restartTest} type="button">
                  Zamiesat
                </button>
                <button className="button primary" onClick={() => setSubmitted(true)} type="button">
                  Vyhodnotit
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function isQuestionCorrect(question: GiftQuestion, selectedAnswerIds: string[]) {
  const selected = new Set(selectedAnswerIds);
  const correct = question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.id);

  return correct.length === selected.size && correct.every((answerId) => selected.has(answerId));
}

function shuffleQuestions<T extends { id: string }>(items: T[], seed: number): T[] {
  const keyed = items.map((item, index) => ({
    item,
    order: seededNumber(`${item.id}-${index}-${seed}`),
  }));

  return keyed.sort((a, b) => a.order - b.order).map(({ item }) => item);
}

function seededNumber(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}
