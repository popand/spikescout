import { NextResponse } from 'next/server';
import Replicate from 'replicate';

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error('Missing Replicate API token');
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { prompt, athleteProfile, school, coach } = await req.json();

    let systemMessage = '';
    if (!prompt) {
      // For auto-generate, create a detailed system message using athlete profile and school details
      systemMessage = `You are an expert in crafting personalized volleyball recruitment messages. 
      Create a message from an athlete to a volleyball coach expressing interest in their program.
      
      Athlete Profile:
      - Name: ${athleteProfile.name}
      - Position: ${athleteProfile.stats.position}
      - Height: ${athleteProfile.stats.height}
      - Vertical Jump: ${athleteProfile.stats.verticalJump}
      - GPA: ${athleteProfile.stats.gpa}
      - Graduation Year: ${athleteProfile.stats.graduationYear}
      - Club: ${athleteProfile.stats.club}
      - About: ${athleteProfile.description}
      - Interests: ${athleteProfile.interests.join(', ')}
      
      School Details:
      - School: ${school.name}
      - Division: ${school.division}
      - Location: ${school.location}
      - Coach: ${coach.name} (${coach.title})
      
      Generate a professional, personalized message expressing interest in the volleyball program. 
      Highlight relevant achievements, demonstrate knowledge of the school's program, 
      and show enthusiasm for potentially joining the team.`;
    }

    const output = await replicate.run(
      "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
      {
        input: {
          prompt: prompt || systemMessage || 'Generate a volleyball recruitment message',
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.1,
          system_prompt: "You are an expert in crafting personalized volleyball recruitment messages."
        }
      }
    );

    if (!output) {
      throw new Error('No output from Replicate');
    }

    // The output from Llama-2 comes as an array of strings, join them
    const messageContent = Array.isArray(output) ? output.join('') : output;

    return NextResponse.json({ response: messageContent });
  } catch (error) {
    console.error("Replicate API Error:", error);
    return NextResponse.json(
      { 
        error: "Message generation failed", 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 