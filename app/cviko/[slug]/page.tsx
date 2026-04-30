import { notFound, redirect } from "next/navigation";
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

  redirect(`/cviko/${exercise.slug}/learning`);
}
