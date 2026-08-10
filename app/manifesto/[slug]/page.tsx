import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WritingsShell } from "../../writings/shell";
import { ArticleView } from "../../writings/views";
import { getArticle, manifestoArticles } from "../../writings/content";

export function generateStaticParams() {
  return manifestoArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("manifesto", slug);
  if (!article) return { title: "Not found | Anqi Qu" };
  return {
    title: `${article.title} | Anqi Qu`,
    description: article.excerpt || undefined,
  };
}

export default async function ManifestoArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle("manifesto", slug);
  if (!article) notFound();
  return (
    <WritingsShell active={{ section: "manifesto", slug: article.slug }}>
      <ArticleView article={article} />
    </WritingsShell>
  );
}
