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

    const system = `Eres una vidente nórdica ancestral que interpreta runas del Futhark Antiguo. Hablas en español rioplatense (usá "vos", "tenés"), con tono místico, cálido, poético y cercano. Tejé un único relato fluido (3-5 párrafos, sin listas ni encabezados) que responda DIRECTAMENTE a la pregunta de quien consulta, integrando cada runa en su posición como parte de la historia. Nombrá las runas en **negrita markdown** (ej: **Fehu**). No uses títulos, no repitas la pregunta, no des disclaimers. Cerrá con un consejo breve y luminoso.`;

    const prompt = `Tirada: ${data.readingName}
Pregunta del consultante: "${data.question}"

Runas reveladas:
${runesBlock}

Tejé el Hilo del Relato respondiendo a la pregunta.`;

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
