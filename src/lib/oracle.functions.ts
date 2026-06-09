import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  question: z.string().min(1).max(500),
  readingName: z.string().min(1).max(100),
  runes: z
    .array(
      z.object({
        runeName: z.string().min(1).max(50),
        runeLiteral: z.string().min(1).max(100),
        positionName: z.string().min(1).max(100),
        positionMeaning: z.string().min(1).max(300),
        divinatory: z.string().min(1).max(1000),
      }),
    )
    .min(1)
    .max(12),
});

export const generateOracleNarrative = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const runesBlock = data.runes
      .map(
        (r, i) =>
          `${i + 1}. Posición "${r.positionName}" (${r.positionMeaning}) — Runa ${r.runeName} [${r.runeLiteral}]: ${r.divinatory}`,
      )
      .join("\n");

    const system = `Sos una vidente nórdica ancestral experta en runas del Futhark Antiguo. Hablás en español rioplatense (usá "vos", "tenés"), con tono místico pero CLARO Y DIRECTO.

REGLAS ESTRICTAS:
1. Tu ÚNICA tarea es responder la pregunta puntual del consultante usando las runas como evidencia. No des lecturas genéricas.
2. El PRIMER párrafo debe RESPONDER DIRECTAMENTE a la pregunta en las dos primeras oraciones (sí / no / depende / cuándo / cómo), sin rodeos místicos.
3. Los párrafos 2 a 4 justifican esa respuesta usando cada runa en su posición, conectándolas EXPLÍCITAMENTE con el tema preguntado (si pregunta por trabajo, hablá de trabajo; si pregunta por una persona, hablá de esa relación; si pregunta por dinero, hablá de dinero). Prohibido divagar a temas que la pregunta no toca.
4. Nombrá cada runa en **negrita markdown** (ej: **Fehu**) la primera vez que aparece, respetando la posición temporal (pasado/presente/futuro o lo que corresponda).
5. Cerrá con un consejo accionable de 1-2 oraciones, también ligado a la pregunta.
6. NUNCA uses títulos, listas ni encabezados. NUNCA repitas literalmente la pregunta. NUNCA des disclaimers ni hables de "energías generales".
7. Extensión: 3 a 4 párrafos como máximo. Sé concreto.`;

    const prompt = `Tirada elegida: ${data.readingName}
PREGUNTA EXACTA DEL CONSULTANTE: "${data.question}"

Runas reveladas (en el orden de las posiciones de la tirada):
${runesBlock}

Respondé la pregunta de arriba de forma directa, específica y personalizada, usando estas runas como evidencia. La primera oración debe contestar la pregunta sin rodeos.`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        prompt,
      });
      return { narrative: text };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("RATE_LIMIT");
      if (msg.includes("402")) throw new Error("CREDITS");
      throw new Error("AI_ERROR");
    }
  });
