import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please add GEMINI_API_KEY to your .env file.' },
        { status: 500 }
      );
    }

    // Initialize Gemini with API key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Initialize Gemini model with safety settings
    // Use model from env or default to gemini-pro
    const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
    console.log('Using Gemini model:', modelName);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    // Build conversation history for context
    const chatHistory = history
      ?.filter(msg => msg.role !== 'assistant' || !msg.content.includes('👋 Hi!')) // Skip initial greeting
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })) || [];

    // System prompt for medical context
    const systemPrompt = `You are Cura AI, a helpful medical research assistant for the Curalink platform. 

Your role is to:
- Provide accurate, evidence-based medical information
- Help users understand health conditions, symptoms, and treatments
- Guide users to find clinical trials, research publications, and medical specialists on the platform
- Offer emotional support and encouragement
- Always remind users to consult healthcare professionals for medical advice

Important guidelines:
- Be empathetic and supportive
- Use clear, accessible language
- Cite medical sources when possible
- For emergencies, direct users to call 911 or emergency services
- For mental health crises, provide crisis hotline numbers (988 for suicide prevention)
- Never diagnose or prescribe treatments
- Encourage users to use Curalink features (clinical trials, publications, specialists, forums)

Platform features you can help with:
- Finding clinical trials by condition
- Searching medical publications and research
- Connecting with medical specialists and researchers
- Joining patient support forums
- Accessing health resources and education

Be concise but thorough. Use emojis sparingly for emphasis.`;

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I am Cura AI, a medical research assistant for Curalink. I will provide helpful, evidence-based information while always encouraging users to consult healthcare professionals. I will be empathetic, clear, and guide users to platform features when appropriate.' }]
        },
        ...chatHistory
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);
    console.error('Error details:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your GEMINI_API_KEY in .env file.' },
        { status: 500 }
      );
    }
    
    if (error.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request to AI service. Please check your API key configuration.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later or check your API key limits.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
