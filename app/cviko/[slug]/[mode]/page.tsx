import Link from "next/link";
import { notFound } from "next/navigation";
import QuizWorkspace from "@/components/QuizWorkspace";
import { getExercise, getExercises } from "@/lib/gift";

type RouteMode = "learning" | "test";

type PageProps = {
  params: Promise<{ slug: string; mode: string }>;
};

const ROUTE_MODES: RouteMode[] = ["learning", "test"];

export async function generateStaticParams() {
  const exercises = await getExercises();

  return exercises.flatMap((exercise) => ROUTE_MODES.map((mode) => ({ slug: exercise.slug, mode })));
}

export default async function ExerciseModePage({ params }: PageProps) {
  const { slug, mode } = await params;

  if (!isRouteMode(mode)) {
    notFound();
  }

  const exercise = await getExercise(slug);

  if (!exercise) {
    notFound();
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Cviko</p>
            <h1>{exercise.name}</h1>
            <p className="lead">Learning cast robi z otazok karticky. Test cast ich zamiesa a vyhodnoti presne oznacene spravne odpovede.</p>
          </div>
          <Link className="button ghost" href="/">
            Vyber cviko
          </Link>
        </header>

        <QuizWorkspace exercise={exercise} mode={mode === "learning" ? "learn" : "test"} />
      </div>
    </main>
  );
}

function isRouteMode(mode: string): mode is RouteMode {
  return ROUTE_MODES.includes(mode as RouteMode);
}
