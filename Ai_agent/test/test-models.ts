// Test des différents modèles Mistral AI
import { Mistral } from '@mistralai/mistralai';
import * as dotenv from 'dotenv';

dotenv.config();

// Prompt de test pour comparer les modèles
const TEST_PROMPT = `You are a financial risk analyst for a treasury management system.

Analyze this situation and decide what action to take:

Context:
- Treasury balance: $2,000,000 USDC
- Current allocation: 70% in SafeVault (TierA), 30% in Aave (TierB)
- USDC peg: 0.997 (slightly below 0.998 threshold)
- Aave TVL: Stable, no significant changes
- Liquidity ratio: 0.18 (healthy)

Question: Should we take any action? Explain your reasoning step by step.`;

interface ModelTest {
  name: string;
  model: string;
  temperature: number;
  expectReasoning: boolean;
}

const MODELS_TO_TEST: ModelTest[] = [
  {
    name: 'Mistral Small 3.2',
    model: 'mistral-small-2506',
    temperature: 0.3,
    expectReasoning: false
  },
  {
    name: 'Mistral Medium 3',
    model: 'mistral-medium-2505',
    temperature: 0.3,
    expectReasoning: false
  },
  {
    name: 'Magistral Medium 1.2 (Reasoning)',
    model: 'magistral-medium-2509',
    temperature: 0.3,
    expectReasoning: true
  }
];

async function testModel(client: Mistral, test: ModelTest): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${test.name} (${test.model})`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();

    const response = await client.chat.complete({
      model: test.model,
      messages: [
        {
          role: 'user',
          content: TEST_PROMPT
        }
      ],
      maxTokens: 500,
      temperature: test.temperature
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const messageContent = response.choices?.[0]?.message?.content;
    const message = typeof messageContent === 'string'
      ? messageContent
      : Array.isArray(messageContent)
        ? JSON.stringify(messageContent)
        : 'No response';

    console.log(`⏱️  Response time: ${duration}s\n`);
    console.log(`📝 Response:\n`);
    console.log(message);
    console.log(`\n${'─'.repeat(80)}\n`);

    console.log(`📊 Usage Statistics:`);
    console.log(`   Prompt tokens: ${response.usage?.promptTokens}`);
    console.log(`   Completion tokens: ${response.usage?.completionTokens}`);
    console.log(`   Total tokens: ${response.usage?.totalTokens}`);

    // Analyser si le modèle utilise du reasoning
    const messageText = String(message);
    const hasStepByStep = /step \d|first|second|third|then|therefore|because/i.test(messageText);
    const hasStructuredThinking = /analysis|reasoning|conclusion|recommendation/i.test(messageText);

    console.log(`\n🧠 Reasoning Analysis:`);
    console.log(`   Expected reasoning: ${test.expectReasoning ? '✅ Yes' : '❌ No'}`);
    console.log(`   Step-by-step detected: ${hasStepByStep ? '✅ Yes' : '❌ No'}`);
    console.log(`   Structured thinking: ${hasStructuredThinking ? '✅ Yes' : '❌ No'}`);

    console.log(`\n✅ Test completed successfully`);

  } catch (error: any) {
    console.error(`\n❌ Error testing ${test.name}:`);
    console.error(error.message);

    if (error.message.includes('model')) {
      console.log(`\n💡 Note: Model "${test.model}" might not be available or the name might have changed.`);
      console.log(`   Check https://docs.mistral.ai/getting-started/models for current model names.`);
    }
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Mistral AI Model Comparison Tests\n');

  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Error: MISTRAL_API_KEY not found in .env file');
    process.exit(1);
  }

  const client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
  });

  console.log('✅ Mistral client initialized\n');
  console.log(`📋 Testing ${MODELS_TO_TEST.length} models:\n`);
  MODELS_TO_TEST.forEach((test, idx) => {
    console.log(`   ${idx + 1}. ${test.name} (${test.model})`);
  });

  // Test chaque modèle séquentiellement
  for (const test of MODELS_TO_TEST) {
    await testModel(client, test);

    // Pause entre les tests pour éviter le rate limiting
    if (test !== MODELS_TO_TEST[MODELS_TO_TEST.length - 1]) {
      console.log('\n⏳ Waiting 2s before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 All tests completed!');
  console.log(`${'='.repeat(80)}\n`);

  console.log('📊 Summary:');
  console.log('   - Mistral Small: Fast, cost-effective, basic reasoning');
  console.log('   - Mistral Medium: Better performance, good for execution tasks');
  console.log('   - Magistral Medium: Advanced reasoning, best for complex decisions\n');
}

// Run tests
runAllTests().catch(console.error);
