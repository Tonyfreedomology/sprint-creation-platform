// Test script to verify n8n integration
// Run with: node test-integration.js

const testPayload = {
  sprint_theme: "21-Day Self-Worth Journey",
  duration: 21,
  teaching_goals: "Help participants build unshakeable self-worth through daily practices and mindset shifts",
  voice_sample_url: "",
  email_style: "encouraging",
  participant_emails: "test1@example.com, test2@example.com, test3@example.com",
  creator_name: "Tony Freedom",
  personalization_data: "Target Audience: Working mothers. Experience Level: intermediate. Content Types: video, audio, exercises. Special Requirements: Focus on time-efficient practices",
  sprint_description: "A transformational 21-day journey to build lasting self-worth",
  sprint_category: "personal",
  creator_email: "test@freedomology.com",
  creator_bio: "Personal development expert with 10+ years experience",
  content_generation: "ai",
  timestamp: new Date().toISOString(),
  source: "freedomology-sprint-creator"
};

async function testWebhook() {
  try {
    console.log('🚀 Testing webhook integration...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('https://freedomology.app.n8n.cloud/webhook/create-sprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('Parsed response:', jsonResponse);
      } catch (e) {
        console.log('Response is not JSON, which is expected for n8n workflow trigger');
      }
    } else {
      console.log('❌ Webhook test failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWebhook();