import type { Lang } from '../../shared-types'
import { KNOWLEDGE, type KnowledgeArticle } from '../../database/demo-data/knowledge'

/** Evidence Retrieval Service — keyword scoring over the source-backed knowledge base. */
export function retrieveArticles(query: string, limit = 2, topic?: KnowledgeArticle['topic']): KnowledgeArticle[] {
  const q = query.toLowerCase()
  const words = q.split(/[^\p{L}\p{M}\d-]+/u).filter((w) => w.length > 3)
  return KNOWLEDGE.filter((a) => !topic || a.topic === topic)
    .map((a) => {
      let score = 0
      for (const k of a.keywords) if (q.includes(k.toLowerCase())) score += 3
      for (const w of words) if (a.title.en.toLowerCase().includes(w)) score += 1
      return { a, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a)
}

export function articleById(id: string): KnowledgeArticle | undefined {
  return KNOWLEDGE.find((a) => a.id === id)
}

export function localise(a: KnowledgeArticle, lang: Lang) {
  return { title: a.title[lang] ?? a.title.en, summary: a.summary[lang] ?? a.summary.en }
}
