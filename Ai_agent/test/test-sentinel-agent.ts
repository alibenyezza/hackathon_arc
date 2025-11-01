// Test du Sentinel Agent avec mock data
import * as dotenv from 'dotenv';
import { SentinelAgent } from '../src/agents/sentinelAgent';
import {
  mockSentinelNormal,
  mockSentinelWarningPeg,
  mockSentinelCriticalTVL,
  mockSentinelCriticalDepeg,
  mockSentinelMultiWarning
} from '../src/mock-data/sentinel-mock';

dotenv.config();

async function testSentinelAgent() {
  console.log('\n🧪 Testing Sentinel Agent\n');
  console.log('='.repeat(80));

  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Error: MISTRAL_API_KEY not found');
    process.exit(1);
  }

  const agent = new SentinelAgent(process.env.MISTRAL_API_KEY);

  // Test 1: Normal scenario (pas de risque)
  console.log('\n📊 Test 1: Normal scenario (all metrics healthy)');
  console.log('-'.repeat(80));

  const result1 = await agent.checkRisks(mockSentinelNormal);

  if (result1.success) {
    console.log(`✅ Analysis successful - Alert level: ${result1.data.alertLevel}`);
    console.log(`   Recommended action: ${result1.data.recommendedAction}`);
    console.log(`   Urgency: ${result1.data.urgency}`);
    console.log(`   Triggers: ${result1.data.triggers.length}`);

    if (result1.data.reasoning && result1.data.reasoning.length > 0) {
      console.log(`\n🧠 Reasoning:`);
      result1.data.reasoning.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step}`);
      });
    }
  } else {
    console.log('❌ Analysis failed:', result1.error);
  }

  // Test 2: WARNING - USDC peg légèrement bas
  console.log('\n\n📊 Test 2: WARNING - USDC peg at 0.997');
  console.log('-'.repeat(80));

  const result2 = await agent.checkRisks(mockSentinelWarningPeg);

  if (result2.success) {
    console.log(`✅ Analysis successful - Alert level: ${result2.data.alertLevel}`);
    console.log(`   USDC Peg: ${result2.data.currentMetrics.usdcPeg}`);
    console.log(`   Recommended action: ${result2.data.recommendedAction}`);
    console.log(`   Urgency: ${result2.data.urgency}`);
    console.log(`   Triggers found: ${result2.data.triggers.length}`);

    result2.data.triggers.forEach(t => {
      console.log(`   - [${t.severity}] ${t.message}`);
    });

    if (result2.data.reasoning && result2.data.reasoning.length > 0) {
      console.log(`\n🧠 Reasoning (abbreviated):`);
      console.log(`   ${result2.data.reasoning[0]}`);
      console.log(`   ... (${result2.data.reasoning.length} steps total)`);
    }
  } else {
    console.log('❌ Analysis failed:', result2.error);
  }

  // Test 3: CRITICAL - TVL drop massif
  console.log('\n\n📊 Test 3: CRITICAL - Aave TVL dropped 40%');
  console.log('-'.repeat(80));

  const result3 = await agent.checkRisks(mockSentinelCriticalTVL);

  if (result3.success) {
    console.log(`🚨 Analysis successful - Alert level: ${result3.data.alertLevel}`);
    console.log(`   Recommended action: ${result3.data.recommendedAction}`);
    if (result3.data.withdrawAmount) {
      console.log(`   Withdraw amount: $${result3.data.withdrawAmount.toLocaleString()}`);
    }
    console.log(`   Urgency: ${result3.data.urgency}`);
    console.log(`   Triggers found: ${result3.data.triggers.length}`);

    result3.data.triggers.forEach(t => {
      console.log(`   - [${t.severity}] ${t.message}`);
    });

    console.log(`\n🧠 Reasoning:`);
    result3.data.reasoning.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  } else {
    console.log('❌ Analysis failed:', result3.error);
  }

  // Test 4: CRITICAL - USDC depeg sévère
  console.log('\n\n📊 Test 4: CRITICAL - USDC depeg at 0.992');
  console.log('-'.repeat(80));

  const result4 = await agent.checkRisks(mockSentinelCriticalDepeg);

  if (result4.success) {
    console.log(`🚨 Analysis successful - Alert level: ${result4.data.alertLevel}`);
    console.log(`   USDC Peg: ${result4.data.currentMetrics.usdcPeg}`);
    console.log(`   Recommended action: ${result4.data.recommendedAction}`);
    if (result4.data.withdrawAmount) {
      console.log(`   Withdraw amount: $${result4.data.withdrawAmount.toLocaleString()}`);
    }
    console.log(`   Urgency: ${result4.data.urgency}`);
    console.log(`   Expected: Immediate WITHDRAW_ALL`);
  } else {
    console.log('❌ Analysis failed:', result4.error);
  }

  // Test 5: Multi-WARNING - Plusieurs signaux faibles
  console.log('\n\n📊 Test 5: Multi-WARNING - Multiple weak signals');
  console.log('-'.repeat(80));

  const result5 = await agent.checkRisks(mockSentinelMultiWarning);

  if (result5.success) {
    console.log(`✅ Analysis successful - Alert level: ${result5.data.alertLevel}`);
    console.log(`   Recommended action: ${result5.data.recommendedAction}`);
    console.log(`   Urgency: ${result5.data.urgency}`);
    console.log(`   Triggers found: ${result5.data.triggers.length}`);

    result5.data.triggers.forEach(t => {
      console.log(`   - [${t.severity}] ${t.message}`);
    });

    console.log(`\n🧠 Reasoning (nuanced decision):`);
    result5.data.reasoning.slice(0, 3).forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  } else {
    console.log('❌ Analysis failed:', result5.error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Sentinel Agent tests completed!\n');
}

// Run tests
testSentinelAgent().catch(console.error);
