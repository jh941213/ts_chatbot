import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config/env';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function generateResponse(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "당신은 도움이 되는 어시스턴트입니다." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.1,
    });

    // 응답이 없거나 choices 배열이 비어있는 경우를 처리합니다.
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('API 응답에 선택 사항이 없습니다.');
    }

    // 옵셔널 체이닝을 사용하여 안전하게 접근합니다.
    return completion.choices[0]?.message?.content?.trim() ?? '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';
  }
}