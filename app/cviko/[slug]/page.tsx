import Link from "next/link";
import { notFound } from "next/navigation";
import QuizWorkspace from "@/components/QuizWorkspace";
import { getExercise, getExercises } from "@/lib/gift";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const exercises = await getExercises();
  return exercises.map((exercise) => ({ slug: exercise.slug }));
}

export default async function ExercisePage({ params }: PageProps) {
  const { slug } = await params;
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

        <QuizWorkspace exercise={exercise} />
      </div>
    </main>
  );
}
