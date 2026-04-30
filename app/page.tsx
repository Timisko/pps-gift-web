import Link from "next/link";
import { getExercises } from "@/lib/gift";

export default async function Home() {
  const exercises = await getExercises();

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">GIFT quiz</p>
            <h1>Vyber cviko</h1>
            <p className="lead">Otazky sa nacitaju priamo z GIFT suborov v adresari daneho cvika.</p>
          </div>
        </header>

        <section className="exercise-grid" aria-label="Cvika">
          {exercises.map((exercise) => (
            <Link className="exercise-card" href={`/cviko/${exercise.slug}`} key={exercise.slug}>
              <div className="exercise-title">{exercise.name}</div>
              <div className="exercise-meta">
                {exercise.questionCount} otazok · {exercise.files.length} subory
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
