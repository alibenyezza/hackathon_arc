// Test du Allocator Agent avec mock data
import * as dotenv from 'dotenv';
import { AllocatorAgent } from '../src/agents/allocatorAgent';
import {
  mockAllocatorNormal,
  mockAllocatorViolationTierB,
  mockAllocatorViolationMinAmount,
  mockAllocatorViolationBalance,
  mockAllocatorConservative
} from '../src/mock-data/allocator-mock';

dotenv.config();

async function testAllocatorAgent() {
  console.log('\n🧪 Testing Allocator Agent\n');
  console.log('='.repeat(80));

  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Error: MISTRAL_API_KEY not found');
    process.exit(1);
  }

  const agent = new AllocatorAgent(process.env.MISTRAL_API_KEY);

  // Test 1: Allocation normale valide
  console.log('\n📊 Test 1: Normal allocation (60% A, 40% B)');
  console.log('-'.repeat(80));

  const result1 = await agent.execute(mockAllocatorNormal);

  if (result1.success) {
    console.log(`✅ Execution successful`);
    console.log(`   Executed: ${result1.data.executed}`);
    console.log(`   Policy check: ${result1.data.policyCheck.passed}`);
    console.log(`   Tier A: $${result1.data.finalAllocation.tierA.toLocaleString()}`);
    console.log(`   Tier B: $${result1.data.finalAllocation.tierB.toLocaleString()}`);
    console.log(`   Transactions: ${result1.data.transactions.length}`);

    result1.data.transactions.forEach(tx => {
      console.log(`   - ${tx.target}: $${tx.amount.toLocaleString()} (${tx.status})`);
    });
  } else {
    console.log('❌ Execution failed:', result1.error);
  }

  // Test 2: Violation - Tier B trop élevé
  console.log('\n\n📊 Test 2: VIOLATION - Tier B too high (70%)');
  console.log('-'.repeat(80));

  const result2 = await agent.execute(mockAllocatorViolationTierB);

  if (!result2.success) {
    console.log(`❌ Execution rejected (expected)`);
    console.log(`   Policy check passed: ${result2.data.policyCheck.passed}`);
    console.log(`   Violations found: ${result2.data.policyCheck.violations.length}`);

    result2.data.policyCheck.violations.forEach(v => {
      console.log(`   - ${v}`);
    });
  } else {
    console.log('⚠️  WARNING: Execution should have been rejected!');
  }

  // Test 3: Violation - Montant minimum
  console.log('\n\n📊 Test 3: VIOLATION - Amount below minimum ($30k < $50k)');
  console.log('-'.repeat(80));

  const result3 = await agent.execute(mockAllocatorViolationMinAmount);

  if (!result3.success) {
    console.log(`❌ Execution rejected (expected)`);
    console.log(`   Violations found: ${result3.data.policyCheck.violations.length}`);

    result3.data.policyCheck.violations.forEach(v => {
      console.log(`   - ${v}`);
    });
  } else {
    console.log('⚠️  WARNING: Execution should have been rejected!');
  }

  // Test 4: Violation - Balance insuffisant
  console.log('\n\n📊 Test 4: VIOLATION - Insufficient balance ($3M > $2M)');
  console.log('-'.repeat(80));

  const result4 = await agent.execute(mockAllocatorViolationBalance);

  if (!result4.success) {
    console.log(`❌ Execution rejected (expected)`);
    console.log(`   Violations found: ${result4.data.policyCheck.violations.length}`);

    result4.data.policyCheck.violations.forEach(v => {
      console.log(`   - ${v}`);
    });
  } else {
    console.log('⚠️  WARNING: Execution should have been rejected!');
  }

  // Test 5: Allocation conservatrice (80% Tier A)
  console.log('\n\n📊 Test 5: Conservative allocation (80% A, 20% B)');
  console.log('-'.repeat(80));

  const result5 = await agent.execute(mockAllocatorConservative);

  if (result5.success) {
    console.log(`✅ Execution successful`);
    console.log(`   Policy check: ${result5.data.policyCheck.passed}`);
    console.log(`   Tier A: $${result5.data.finalAllocation.tierA.toLocaleString()} (${((result5.data.finalAllocation.tierA / result5.data.finalAllocation.total) * 100).toFixed(1)}%)`);
    console.log(`   Tier B: $${result5.data.finalAllocation.tierB.toLocaleString()} (${((result5.data.finalAllocation.tierB / result5.data.finalAllocation.total) * 100).toFixed(1)}%)`);
    console.log(`   Transactions: ${result5.data.transactions.length}`);
    console.log(`   Expected: Very safe allocation, should be approved`);
  } else {
    console.log('❌ Execution failed:', result5.error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Allocator Agent tests completed!\n');
}

// Run tests
testAllocatorAgent().catch(console.error);
