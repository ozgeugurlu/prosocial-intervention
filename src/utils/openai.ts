export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Scaffolding for OpenAI API Connector.
 * In the final version, this utility will communicate with OpenAI's chat completions API
 * to send the message history and retrieve responses from the chatbot "Kai".
 */
export async function sendMessageToOpenAI(history: ChatMessage[]): Promise<string> {
  // Scaffold: Place your API key here (e.g. from process.env or expo-constants)
  // const openAiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // Format the history for the OpenAI chat completion payload
  const formattedMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Add the system prompt defining Kai's behavior
  const systemPrompt = {
    role: 'system',
    content: 'You are Kai, a supportive and warm companion. Your goal is to help the user become more prosocial and achieve their change goals. Keep answers relatively short, thoughtful, and friendly.'
  };

  try {
    // Scaffold implementation of the fetch call to OpenAI (unimplemented for now)
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-3.5-turbo
        messages: [systemPrompt, ...formattedMessages],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with code ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
    */

    // Simulate network delay to demonstrate the UI loading state
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fallback response for mock testing in the app
    const lastUserMessage = history[history.length - 1]?.content.toLowerCase() || '';

    if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
      return "Hello! I am so glad you reached out. How has your day been so far?";
    } else if (lastUserMessage.includes('sad') || lastUserMessage.includes('bad') || lastUserMessage.includes('stress')) {
      return "I'm sorry to hear that you're feeling this way. It's completely okay to have off days. What do you feel is causing this stress, and is there anything small we can do to help you feel supported?";
    } else if (lastUserMessage.includes('thank') || lastUserMessage.includes('great') || lastUserMessage.includes('good')) {
      return "That's wonderful to hear! Keeping a positive mindset is a big step on this journey. How can I help you focus on your goals today?";
    }

    return "Thank you for sharing that with me. Every small reflection is a step towards positive change. Tell me more about how that makes you feel.";
  } catch (error) {
    console.error('Error in sendMessageToOpenAI scaffolding:', error);
    throw error;
  }
}
