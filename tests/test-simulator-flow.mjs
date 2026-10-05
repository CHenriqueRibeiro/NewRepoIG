async function testSimulatorFlow() {
  console.log('Testing simulator event injection and AI rescue...');

  // 1. Post a new comment
  const commentRes = await fetch('http://localhost:3000/api/simulator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'new_comment',
      buyer: '@maria_fashion',
      comment: 'Tem o vestido tamanho 40 no estoque?',
    }),
  });
  const commentData = await commentRes.json();
  console.log('1. Injected comment:', commentData.success);

  // 2. Fetch interactions
  const getRes = await fetch('http://localhost:3000/api/simulator');
  const getData = await getRes.json();
  const lastInteraction = getData.interactions[0];
  console.log('2. Retrieved last interaction:', lastInteraction.buyer, '-', lastInteraction.comment, '| Status:', lastInteraction.status);

  // 3. Trigger AI rescue
  const rescueRes = await fetch('http://localhost:3000/api/simulator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'trigger_ai_rescue' }),
  });
  const rescueData = await rescueRes.json();
  console.log('3. Triggered AI rescue:', rescueData.success);

  // 4. Verify updated state
  const updatedRes = await fetch('http://localhost:3000/api/simulator');
  const updatedData = await updatedRes.json();
  const rescuedInteraction = updatedData.interactions.find(i => i.buyer === '@maria_fashion');
  console.log('4. Rescued item status:', rescuedInteraction?.status, '| Reply:', rescuedInteraction?.storeReply);

  if (rescuedInteraction?.status === 'respondido') {
    console.log('\n✅ Interactive Simulator & AI Rescue Flow Verified Successfully!');
  } else {
    throw new Error('AI Rescue did not update interaction status to respondido');
  }
}

testSimulatorFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
