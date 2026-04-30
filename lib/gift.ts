import { promises as fs } from "fs";
import path from "path";

export type GiftAnswer = {
  id: string;
  text: string;
  fraction: number;
  isCorrect: boolean;
};

export type GiftQuestion = {
  id: string;
  title: string;
  text: string;
  answers: GiftAnswer[];
  sourceFile: string;
};

export type Exercise = {
  slug: string;
  name: string;
  questionCount: number;
  files: string[];
  questions: GiftQuestion[];
};

const COMMENT_LINE = /^\s*\/\//;
const SYSTEM_DIRECTORIES = new Set(["app", "components", "lib", "node_modules", "public"]);

export async function getExercises(): Promise<Exercise[]> {
  const root = getProjectPath();
  const entries = await fs.readdir(root, { withFileTypes: true });
  const directories = entries.filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith(".") && !SYSTEM_DIRECTORIES.has(entry.name),
  );

  const exercises = await Promise.all(
    directories.map(async (directory) => {
      const directoryPath = getProjectPath(directory.name);
      const files = (await fs.readdir(directoryPath))
        .filter((file) => /\.(gift)$/i.test(file))
        .sort((a, b) => a.localeCompare(b));

      const questionsByFile = await Promise.all(
        files.map(async (file) => {
          const content = await fs.readFile(path.join(directoryPath, file), "utf8");
          return parseGift(content, file);
        }),
      );

      const questions = questionsByFile.flat().map((question, index) => ({
        ...question,
        id: `${directory.name}-${index}-${question.id}`,
      }));

      return {
        slug: directory.name,
        name: directory.name.replaceAll("-", " "),
        questionCount: questions.length,
        files,
        questions,
      };
    }),
  );

  return exercises.filter((exercise) => exercise.questionCount > 0);
}

function getProjectPath(...segments: string[]): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), ...segments);
}

export async function getExercise(slug: string): Promise<Exercise | undefined> {
  const exercises = await getExercises();
  return exercises.find((exercise) => exercise.slug === slug);
}

export function parseGift(content: string, sourceFile: string): GiftQuestion[] {
  const cleaned = content
    .split(/\r?\n/)
    .filter((line) => !COMMENT_LINE.test(line))
    .join("\n");

  const questions: GiftQuestion[] = [];
  let cursor = 0;

  while (cursor < cleaned.length) {
    const openIndex = cleaned.indexOf("{", cursor);
    if (openIndex === -1) break;

    const closeIndex = findMatchingBrace(cleaned, openIndex);
    if (closeIndex === -1) break;

    const header = cleaned.slice(cursor, openIndex).trim();
    const body = cleaned.slice(openIndex + 1, closeIndex);
    const parsedHeader = parseHeader(header);
    const answers = parseAnswers(body);

    if (parsedHeader.text && answers.length > 0) {
      const questionId = slugify(`${sourceFile}-${parsedHeader.title || parsedHeader.text}-${questions.length}`);
      questions.push({
        id: questionId,
        title: parsedHeader.title,
        text: parsedHeader.text,
        answers,
        sourceFile,
      });
    }

    cursor = closeIndex + 1;
  }

  return questions;
}

function parseHeader(header: string): { title: string; text: string } {
  const match = header.match(/::([^:]+)::([\s\S]*)$/);

  if (!match) {
    return { title: "", text: normalizeText(header) };
  }

  return {
    title: normalizeText(match[1]),
    text: normalizeText(match[2]),
  };
}

function parseAnswers(body: string): GiftAnswer[] {
  const parts = body
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return parts
    .map((line, index) => {
      const type = line.at(0);
      if (type !== "=" && type !== "~") return undefined;

      const rest = line.slice(1).trim();
      const percentMatch = rest.match(/^%(-?\d+(?:\.\d+)?)%([\s\S]*)$/);
      const fraction = type === "=" ? 100 : percentMatch ? Number(percentMatch[1]) : 0;
      const text = normalizeText(percentMatch ? percentMatch[2] : rest);

      if (!text) return undefined;

      return {
        id: `a-${index}-${slugify(text).slice(0, 24)}`,
        text,
        fraction,
        isCorrect: type === "=" || fraction > 0,
      };
    })
    .filter((answer): answer is GiftAnswer => Boolean(answer));
}

function findMatchingBrace(value: string, openIndex: number): number {
  let escaped = false;

  for (let index = openIndex + 1; index < value.length; index += 1) {
    const character = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === "}") {
      return index;
    }
  }

  return -1;
}

function normalizeText(value: string): string {
  return value.replaceAll("\\:", ":").replaceAll("\\{", "{").replaceAll("\\}", "}").replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
