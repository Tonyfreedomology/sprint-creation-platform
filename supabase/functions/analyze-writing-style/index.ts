import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }
  
  if (fileName.endsWith('.pdf')) {
    // For PDF, we'll use a simple approach - in production you'd want a proper PDF parser
    // For now, we'll ask the user to provide text files or handle this on the client
    throw new Error('PDF files are not yet supported. Please convert to .txt format.');
  }
  
  if (fileName.endsWith('.docx')) {
    // For DOCX, we'll use a simple approach - in production you'd want a proper DOCX parser
    throw new Error('DOCX files are not yet supported. Please convert to .txt format.');
  }
  
  throw new Error('Unsupported file type. Please upload .txt files.');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Analyzing writing style for file:', file.name);
    
    // Extract text from the file
    const text = await extractTextFromFile(file);
    
    if (text.length < 100) {
      throw new Error('Text too short for style analysis. Please provide at least 100 characters.');
    }

    // Analyze writing style with OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a writing style analyst. Analyze the provided text and create a detailed description of the author's writing style that can be used to instruct an AI to write in the same style.

Focus on:
- Tone and voice (formal, casual, conversational, authoritative, etc.)
- Sentence structure preferences (short/long, simple/complex)
- Vocabulary choices (technical, accessible, metaphorical, etc.)
- Rhythm and flow patterns
- Personality traits that come through in the writing
- Any unique stylistic elements or quirks

Provide a concise but comprehensive style guide that captures the essence of how this author writes.`
          },
          {
            role: 'user',
            content: `Please analyze the writing style of this text:\n\n${text.substring(0, 3000)}` // Limit to first 3000 chars
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const styleAnalysis = openaiData.choices[0]?.message?.content;

    if (!styleAnalysis) {
      throw new Error('Failed to generate style analysis');
    }

    console.log('Style analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        styleAnalysis,
        originalLength: text.length,
        fileName: file.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error analyzing writing style:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});