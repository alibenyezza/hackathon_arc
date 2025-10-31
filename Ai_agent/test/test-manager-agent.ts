// Test du Manager Agent avec mock data
import * as dotenv from 'dotenv';
import { ManagerAgent } from '../src/agents/managerAgent';
import {
  mockManagerNormal,
  mockManagerSentinelWarning,
  mockManagerSentinelCritical,
  mockManagerLowCashflow,
  mockManagerUserOverride,
  mockManagerEmergency
} from '../src/mock-data/manager-mock';

dotenv.config();

async function testManagerAgent() {
  console.log('\n🧪 Testing Manager Agent\n');
  console.log('='.repeat(80));

  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Error: MISTRAL_API_KEY not found');
    process.exit(1);
  }

  const agent = new ManagerAgent(process.env.MISTRAL_API_KEY);

  // Test 1: Normal scenario - Should ALLOCATE
  console.log('\n📊 Test 1: Normal scenario (healthy metrics)');
  console.log('-'.repeat(80));

  const result1 = await agent.decide(mockManagerNormal);

  if (result1.success) {
    console.log(`✅ Decision: ${result1.data.decision}`);
    console.log(`   Confidence: ${(result1.data.reasoning.confidence * 100).toFixed(1)}%`);
    console.log(`   Summary: ${result1.data.reasoning.summary}`);

    if (result1.data.action) {
      console.log(`   Action: ${result1.data.action.type} → ${result1.data.action.target}`);
      if (result1.data.action.params.amount) {
        console.log(`   Amount: $${result1.data.action.params.amount.toLocaleString()}`);
        console.log(`   Tier A: $${result1.data.action.params.tierA?.toLocaleString()}`);
        console.log(`   Tier B: $${result1.data.action.params.tierB?.toLocaleString()}`);
      }
    }

    console.log(`\n🧠 Reasoning (first 3 steps):`);
    result1.data.reasoning.steps.slice(0, 3).forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  } else {
    console.log('❌ Decision failed:', result1.error);
  }

  // Test 2: Sentinel WARNING - Should ALLOCATE but conservatively
  console.log('\n\n📊 Test 2: Sentinel WARNING (USDC peg 0.997)');
  console.log('-'.repeat(80));

  const result2 = await agent.decide(mockManagerSentinelWarning);

  if (result2.success) {
    console.log(`⚠️  Decision: ${result2.data.decision}`);
    console.log(`   Confidence: ${(result2.data.reasoning.confidence * 100).toFixed(1)}%`);
    console.log(`   Sentinel check: ${result2.data.reasoning.factors.sentinelCheck}`);

    if (result2.data.action && result2.data.action.params.tierA && result2.data.action.params.tierB) {
      const total = result2.data.action.params.tierA + result2.data.action.params.tierB;
      const tierAPercent = (result2.data.action.params.tierA / total * 100).toFixed(1);
      const tierBPercent = (result2.data.action.params.tierB / total * 100).toFixed(1);
      console.log(`   Expected: Conservative split (higher Tier A)`);
      console.log(`   Actual: Tier A ${tierAPercent}%, Tier B ${tierBPercent}%`);
    }

    console.log(`\n🧠 Key reasoning:`);
    console.log(`   ${result2.data.reasoning.steps[3]}`);
  } else {
    console.log('❌ Decision failed:', result2.error);
  }

  // Test 3: Sentinel CRITICAL - Should WITHDRAW immediately
  console.log('\n\n📊 Test 3: Sentinel CRITICAL (USDC depeg 0.992)');
  console.log('-'.repeat(80));

  const result3 = await agent.decide(mockManagerSentinelCritical);

  if (result3.success) {
    console.log(`🚨 Decision: ${result3.data.decision}`);
    console.log(`   Confidence: ${(result3.data.reasoning.confidence * 100).toFixed(1)}%`);
    console.log(`   Expected: WITHDRAW (immediate action)`);

    if (result3.data.action) {
      console.log(`   Action: ${result3.data.action.type}`);
      console.log(`   Amount: $${result3.data.action.params.amount?.toLocaleString()}`);
    }

    console.log(`\n🧠 Reasoning:`);
    result3.data.reasoning.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  } else {
    console.log('❌ Decision failed:', result3.error);
  }

  // Test 4: Low cashflow - Should HOLD
  console.log('\n\n📊 Test 4: Low cashflow ($30k < $50k minimum)');
  console.log('-'.repeat(80));

  const result4 = await agent.decide(mockManagerLowCashflow);

  if (result4.success) {
    console.log(`✅ Decision: ${result4.data.decision}`);
    console.log(`   Expected: HOLD (insufficient deployable amount)`);
    console.log(`   Cashflow analysis: ${result4.data.reasoning.factors.cashflowAnalysis}`);
    console.log(`\n🧠 Key insight:`);
    console.log(`   ${result4.data.reasoning.steps[1]}`);
  } else {
    console.log('❌ Decision failed:', result4.error);
  }

  // Test 5: User override - Should respect user input
  console.log('\n\n📊 Test 5: User override (force WITHDRAW)');
  console.log('-'.repeat(80));

  const result5 = await agent.decide(mockManagerUserOverride);

  if (result5.success) {
    console.log(`👤 Decision: ${result5.data.decision}`);
    console.log(`   User requested: WITHDRAW`);
    console.log(`   Reason: Need liquidity for upcoming acquisition`);
    console.log(`   Summary: ${result5.data.reasoning.summary}`);

    if (result5.data.action) {
      console.log(`   Action taken: ${result5.data.action.type}`);
    }
  } else {
    console.log('❌ Decision failed:', result5.error);
  }

  // Test 6: Emergency mode - Should WITHDRAW ALL immediately
  console.log('\n\n📊 Test 6: Emergency mode');
  console.log('-'.repeat(80));

  const result6 = await agent.decide(mockManagerEmergency);

  if (result6.success) {
    console.log(`🚨 Decision: ${result6.data.decision}`);
    console.log(`   Mode: EMERGENCY`);
    console.log(`   Expected: Immediate WITHDRAW_ALL`);
    console.log(`   Confidence: ${(result6.data.reasoning.confidence * 100).toFixed(1)}%`);

    if (result6.data.action) {
      console.log(`   Action: ${result6.data.action.type}`);
      console.log(`   Amount: $${result6.data.action.params.amount?.toLocaleString()}`);
    }

    console.log(`   Summary: ${result6.data.reasoning.summary}`);
  } else {
    console.log('❌ Decision failed:', result6.error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Manager Agent tests completed!\n');
}

// Run tests
testManagerAgent().catch(console.error);
