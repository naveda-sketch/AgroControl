import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada en el servidor' }, { status: 500 });
  }

  const { imageBase64, mimeType, tipo } = await req.json();

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });
  }

  const prompt =
    tipo === 'maleza'
      ? `Eres un agrónomo especialista en cultivos de maíz en México. Analiza esta imagen de campo y determina si hay malezas presentes.

Responde ÚNICAMENTE con JSON válido (sin texto adicional), con este formato:
{
  "nombre": "nombre común de la maleza en español",
  "subtipo_maleza": "hoja_ancha" | "hoja_angosta" | "cyperacea" | "mixta",
  "severidad": "leve" | "moderada" | "severa" | "critica",
  "descripcion": "descripción breve del estado de la maleza, densidad estimada y distribución",
  "producto_recomendado": "herbicida recomendado con principio activo",
  "dosis_recomendada": "dosis por hectárea",
  "confianza": "alta" | "media" | "baja"
}

Si no se puede identificar claramente una maleza, devuelve confianza "baja" e indica lo que se observa.`
      : `Eres un agrónomo especialista en cultivos de maíz en México. Analiza esta imagen de campo y determina si hay plagas o enfermedades presentes.

Responde ÚNICAMENTE con JSON válido (sin texto adicional), con este formato:
{
  "nombre": "nombre común de la plaga o enfermedad en español",
  "descripcion": "descripción del daño observado, estado del cultivo y severidad estimada",
  "producto_recomendado": "insecticida o fungicida recomendado con principio activo",
  "dosis_recomendada": "dosis por hectárea",
  "confianza": "alta" | "media" | "baja"
}

Si no se puede identificar claramente una plaga, devuelve confianza "baja" e indica lo que se observa.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: 'Error de Gemini: ' + err }, { status: 502 });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'No se pudo parsear la respuesta de IA', raw: text }, { status: 422 });
  }
}
