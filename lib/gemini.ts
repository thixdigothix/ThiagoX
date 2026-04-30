import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { QuizTopic, Top10Item } from "./types";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function generateTop10List(topicId: string, topicTitle: string, sourceContext?: string): Promise<QuizTopic> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    tools: [{ googleSearchRetrieval: {} } as any] 
  });

  const prompt = sourceContext 
    ? `Com base no seguinte conteúdo extraído de um site:
    "${sourceContext}"
    
    Gere uma lista dos top 10 items para o tópico: "${topicTitle}".`
    : `Pesquise e gere uma lista dos top 10 items para o tópico de cultura pop: "${topicTitle}".
    Use dados reais e atualizados (2024/2025/2026).`;

  const finalPrompt = `${prompt}
  Para cada item, inclua uma lista de "aliases" (sinônimos, nomes curtos, variações comuns, siglas) para ajudar na validação de respostas.
  Certifique-se de incluir o nome exato do item e o valor numérico/estatístico associado (ex: bilheteria em USD, visualizações, seguidores). 
  Retorne EXCLUSIVAMENTE um JSON.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          items: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                rank: { type: SchemaType.NUMBER },
                name: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                aliases: { 
                  type: SchemaType.ARRAY, 
                  items: { type: SchemaType.STRING } 
                }
              },
              required: ["rank", "name", "value", "aliases"]
            }
          }
        },
        required: ["items"]
      }
    }
  });

  const text = result.response.text() || "{}";
  const rawData = JSON.parse(text);
  const items: Top10Item[] = (rawData.items || []).map((item: any) => ({
    ...item,
    revealed: false
  })).sort((a: any, b: any) => a.rank - b.rank);

  return {
    id: topicId,
    title: topicTitle,
    description: sourceContext ? `Extraído de link externo` : `Pesquisa realizada com Gemini AI`,
    category: "Cultura Pop",
    items
  };
}

export const PREDEFINED_TOPICS = [
  { id: "spotify-streams", title: "Top 10 Músicas Mais Ouvidas no Spotify", description: "O que o mundo está ouvindo agora." },
  { id: "instagram-followers", title: "Top 10 Perfis Mais Seguidos no Instagram", description: "As maiores celebridades digitais." },
  { id: "games-sales", title: "Top 10 Jogos Mais Vendidos da História", description: "Clássicos e fenômenos modernos." },
];

export async function suggestRandomTopic(): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Sugira um tópico criativo e interessante para um quiz de "Top 10" sobre cultura pop brasileira ou mundial (filmes, música, internet, história, celebridades).
  Apenas o título do tópico, curto e direto. Exemplo: "Top 10 Cantores mais seguidos no Twitter".
  Não use aspas na resposta.`;

  const response = await model.generateContent(prompt);
  const text = response.response.text() || "";
  return text.trim().replace(/^"|"$/g, '');
}

export function getCustomTopics(): QuizTopic[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('custom_topics');
  return saved ? JSON.parse(saved) : [];
}

export function saveCustomTopic(topic: QuizTopic) {
  const custom = getCustomTopics();
  const updated = [topic, ...custom.filter(t => t.id !== topic.id)];
  localStorage.setItem('custom_topics', JSON.stringify(updated));
}
