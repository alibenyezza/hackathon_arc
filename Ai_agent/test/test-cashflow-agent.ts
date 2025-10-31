// Test du Cashflow Agent avec mock data
import * as dotenv from 'dotenv';
import { CashflowAgent } from '../src/agents/cashflowAgent';
import { mockCashflowInput, mockCashflowHighVolatility, mockCashflowLowBalance } from '../src/mock-data/cashflow-mock';

dotenv.config();

async function testCashflowAgent() {
  console.log('\n🧪 Testing Cashflow Agent\n');
  console.log('='.repeat(80));

  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Error: MISTRAL_API_KEY not found');
    process.exit(1);
  }

  const agent = new CashflowAgent(process.env.MISTRAL_API_KEY);

  // Test 1: Scénario normal
  console.log('\n📊 Test 1: Normal scenario ($2M balance, normal volatility)');
  console.log('-'.repeat(80));

  const result1 = await agent.analyze(mockCashflowInput);

  if (result1.success) {
    console.log('✅ Analysis successful');
    console.log(`\n📈 Statistics:`);
    console.log(`   Avg monthly expenses: $${result1.data.analysis.avgMonthlyExpenses.toLocaleString()}`);
    console.log(`   Avg monthly income: $${result1.data.analysis.avgMonthlyIncome.toLocaleString()}`);
    console.log(`   Daily burn rate: $${result1.data.analysis.burnRate.toLocaleString()}`);
    console.log(`   Volatility: $${result1.data.analysis.volatility.toLocaleString()}`);

    console.log(`\n💡 Recommendations:`);
    console.log(`   Minimum buffer: $${result1.data.recommendations.minimumBuffer.toLocaleString()}`);
    console.log(`   Deployable amount: $${result1.data.recommendations.deployableAmount.toLocaleString()}`);
    console.log(`   Confidence: ${(result1.data.recommendations.confidenceScore * 100).toFixed(0)}%`);

    console.log(`\n📅 Upcoming obligations (${result1.data.upcomingObligations.length}):`);
    result1.data.upcomingObligations.slice(0, 5).forEach(o => {
      console.log(`   ${o.date}: $${o.amount.toLocaleString()} (${o.category}) - ${(o.confidence * 100).toFixed(0)}% confidence`);
    });

    console.log(`\n🧠 Reasoning:`);
    console.log(`   ${result1.data.recommendations.reasoning}`);

    if (result1.data.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      result1.data.warnings.forEach(w => console.log(`   - ${w}`));
    }
  } else {
    console.log('❌ Analysis failed:', result1.error);
  }

  // Test 2: Scénario haute volatilité
  console.log('\n\n📊 Test 2: High volatility scenario');
  console.log('-'.repeat(80));

  const result2 = await agent.analyze(mockCashflowHighVolatility);

  if (result2.success) {
    console.log('✅ Analysis successful');
    console.log(`   Volatility: $${result2.data.analysis.volatility.toLocaleString()}`);
    console.log(`   Minimum buffer: $${result2.data.recommendations.minimumBuffer.toLocaleString()}`);
    console.log(`   Deployable: $${result2.data.recommendations.deployableAmount.toLocaleString()}`);
    console.log(`   Expected: Higher buffer due to volatility`);
  } else {
    console.log('❌ Analysis failed:', result2.error);
  }

  // Test 3: Scénario balance faible
  console.log('\n📊 Test 3: Low balance scenario ($100k balance)');
  console.log('-'.repeat(80));

  const result3 = await agent.analyze(mockCashflowLowBalance);

  if (result3.success) {
    console.log('✅ Analysis successful');
    console.log(`   Current balance: $${mockCashflowLowBalance.currentBalance.toLocaleString()}`);
    console.log(`   Minimum buffer: $${result3.data.recommendations.minimumBuffer.toLocaleString()}`);
    console.log(`   Deployable: $${result3.data.recommendations.deployableAmount.toLocaleString()}`);
    console.log(`   Expected: Low or zero deployable amount`);

    if (result3.data.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      result3.data.warnings.forEach(w => console.log(`   - ${w}`));
    }
  } else {
    console.log('❌ Analysis failed:', result3.error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Cashflow Agent tests completed!\n');
}

// Run tests
testCashflowAgent().catch(console.error);
