/**
 * Test script to verify OpenAI integration
 * Run with: npx tsx test-openai.ts
 */

import * as dotenv from 'dotenv';
import { getOpenAIClient } from './src/integrations/openai/openai.client';

// Load environment variables
dotenv.config();

async function testOpenAI() {
  console.log('🔍 Testing OpenAI Integration...\n');
  
  // Check if API key is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('💡 Make sure you have added OPENAI_API_KEY to your .env file');
    process.exit(1);
  }
  
  console.log('✅ OpenAI API Key found');
  console.log(`   Key prefix: ${apiKey.substring(0, 15)}...\n`);
  
  // Test the client
  try {
    const client = getOpenAIClient();
    
    console.log('🧪 Testing claim data extraction...\n');
    
    const testDescription = `
      I am John Smith, a resident of Toronto, Ontario. 
      On March 15, 2024, I hired ABC Construction Company to renovate my kitchen for $25,000. 
      They completed the work but refused to pay the remaining $10,000 balance. 
      I sent them an email on April 1st asking for payment, but they didn't respond. 
      I want to file a claim for the $10,000 owed to me.
    `;
    
    console.log('📝 Test description:');
    console.log(testDescription.trim());
    console.log('\n⏳ Calling OpenAI API...\n');
    
    const result = await client.extractClaimData(testDescription);
    
    console.log('✅ OpenAI API call successful!\n');
    console.log('📊 Extraction Results:');
    console.log('━'.repeat(60));
    console.log('\n📋 Extracted Fields:');
    console.log(JSON.stringify(result.extracted, null, 2));
    console.log('\n❓ Missing Fields:');
    console.log(result.missing);
    console.log('\n⚠️  Ambiguous Fields:');
    console.log(JSON.stringify(result.ambiguous, null, 2));
    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ OpenAI integration is working correctly!\n');
    
  } catch (error) {
    console.error('\n❌ OpenAI test failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.message.includes('API key')) {
        console.error('\n💡 Possible issues:');
        console.error('   - API key may be invalid');
        console.error('   - API key may not have proper permissions');
        console.error('   - Check your OpenAI account billing/limits');
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        console.error('\n💡 OpenAI quota/rate limit issue:');
        console.error('   - Check your OpenAI account billing/credits at https://platform.openai.com/account/billing');
        console.error('   - Ensure your API key has sufficient quota');
        console.error('   - Wait a moment if it\'s a temporary rate limit');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
testOpenAI().catch(console.error);

