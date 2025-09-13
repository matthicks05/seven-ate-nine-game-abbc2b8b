import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Card {
  id: string;
  type: 'number' | 'wild';
  value: number | string;
  isVisible: boolean;
}

interface GameState {
  hand: Card[];
  currentSequence: number;
  canDraw: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  discardPile: Card[];
  waitingForAddyCard?: boolean;
  addyBaseSequence?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gameState: GameState = await req.json();
    
    let systemPrompt = '';
    let temperature = 0.7;
    
    // Configure AI based on difficulty
    switch (gameState.difficulty) {
      case 'easy':
        systemPrompt = `You are a beginner AI player in 7-ate-9 card game. You make simple moves and sometimes suboptimal decisions. You prefer to play safe and don't think too strategically about future turns.`;
        temperature = 1.0;
        break;
      case 'medium':
        systemPrompt = `You are an intermediate AI player in 7-ate-9 card game. You understand basic strategy but sometimes miss optimal plays. You balance between playing cards and drawing when unsure.`;
        temperature = 0.8;
        break;
      case 'hard':
        systemPrompt = `You are an advanced AI player in 7-ate-9 card game. You think strategically about card management, timing wild cards effectively, and minimizing your hand size efficiently.`;
        temperature = 0.5;
        break;
      case 'expert':
        systemPrompt = `You are an expert AI player in 7-ate-9 card game. You play optimally, considering all possible moves, timing wild cards perfectly, and using advanced strategies to win efficiently.`;
        temperature = 0.3;
        break;
    }

    const rules = `
7-ate-9 Rules:
- Play cards that match the current sequence number (1→2→3→4→5→6→7→8→9→1)
- Wild cards: ATE (any number), ADD (play then add another card), ÷ (give half cards), 3🇬🇧 (all draw 1), π (discard 1-4s), NU-UH (cancel/skip), 🍽️ (discard 2), -1 (play 3 lower), 2👋 (2 players draw 2)
- Goal: Empty your hand first
- If you can't play, you must draw a card
- ${gameState.waitingForAddyCard ? `SPECIAL: An ADD card was just played. You must play a NUMBER card to add to sequence ${gameState.addyBaseSequence}.` : ''}
    `;

    const prompt = `
${rules}

Current game state:
- Current sequence: ${gameState.currentSequence}
- Your hand: ${JSON.stringify(gameState.hand)}
- Can draw: ${gameState.canDraw}
- Last played card: ${gameState.discardPile.length > 0 ? JSON.stringify(gameState.discardPile[gameState.discardPile.length - 1]) : 'None'}
- ${gameState.waitingForAddyCard ? `Waiting for ADD card follow-up. Must play NUMBER card.` : ''}

Analyze your hand and decide your move. Consider:
1. Cards that can be played immediately
2. Strategic use of wild cards
3. Hand management (keeping useful cards vs playing to reduce hand size)

Respond with a JSON object:
{
  "action": "play" | "draw",
  "cardId": "card_id_if_playing" | null,
  "reasoning": "brief explanation of your decision"
}

${gameState.waitingForAddyCard ? 'IMPORTANT: You MUST play a number card if you have one, or draw if you don\'t.' : ''}
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      const decision = JSON.parse(aiResponse);
      return new Response(JSON.stringify(decision), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback to simple logic
      const playableCards = gameState.waitingForAddyCard 
        ? gameState.hand.filter(card => card.type === 'number')
        : gameState.hand.filter(card => 
            card.type === 'wild' || 
            (card.type === 'number' && card.value === gameState.currentSequence)
          );
      
      if (playableCards.length > 0) {
        return new Response(JSON.stringify({
          action: 'play',
          cardId: playableCards[0].id,
          reasoning: 'Fallback logic - playing first available card'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          action: 'draw',
          cardId: null,
          reasoning: 'Fallback logic - no playable cards'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error) {
    console.error('Error in ai-game-move function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      action: 'draw',
      cardId: null,
      reasoning: 'Error occurred, defaulting to draw'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});