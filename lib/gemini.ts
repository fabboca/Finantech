import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export interface ParsedTransaction {
  date: string; // ISO format or YYYY-MM-DD
  description: string;
  amount: number;
  nature: 'INCOME' | 'EXPENSE';
}

export async function parseStatementText(text: string): Promise<ParsedTransaction[]> {
  const currentYear = new Date().getFullYear();
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analise as transações financeiras do seguinte extrato bancário ou fatura de cartão e extraia as informações em formato JSON. 
O texto pode estar bagunçado ou conter quebras de linha entre a descrição e o valor.
Tente identificar se é Entrada (INCOME) ou Saída (EXPENSE). Geralmente valores positivos em faturas são estornos (INCOME).

IMPORTANTE: 
1. Use o ano atual (${currentYear}) se o ano não estiver especificado.
2. Certifique-se de que os valores decimais usem ponto (.) em vez de vírgula (,) no JSON final.
3. Se o texto estiver truncado, tente remontar a descrição.

Extrato:
${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: {
              type: Type.STRING,
              description: "Data da transação no formato YYYY-MM-DD",
            },
            description: {
              type: Type.STRING,
              description: "Descrição limpa da transação",
            },
            amount: {
              type: Type.NUMBER,
              description: "Valor numérico da transação (sempre positivo)",
            },
            nature: {
              type: Type.STRING,
              enum: ["INCOME", "EXPENSE"],
              description: "Natureza da transação",
            },
          },
          required: ["date", "description", "amount", "nature"],
        },
      },
    },
  });

  try {
    const textOutput = response.text;
    if (!textOutput) return [];
    return JSON.parse(textOutput.trim());
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}
