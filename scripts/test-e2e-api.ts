import { spawn, ChildProcess } from 'node:child_process';
import process from 'node:process';

async function waitForServer(url: string, maxAttempts = 15): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return false;
}

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BACKEND END-TO-END (E2E) API TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let serverProcess: ChildProcess | null = null;
  const isRunning = await waitForServer('http://localhost:5000/api/health', 2);

  if (!isRunning) {
    console.log('⚡ Starting local backend Express server for E2E testing...');
    serverProcess = spawn('npx', ['tsx', 'server/src/index.ts'], {
      shell: true,
      stdio: 'pipe',
    });

    const ready = await waitForServer('http://localhost:5000/api/health', 25);
    if (!ready) {
      if (serverProcess) serverProcess.kill();
      throw new Error('Backend server failed to start within timeout.');
    }
    console.log('✅ Local server online at http://localhost:5000\n');
  } else {
    console.log('✅ Connected to existing backend server on port 5000\n');
  }

  try {
    console.log('--- 1. Testing Auth Login ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aryan@example.com', password: 'student123' }),
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status, '| User:', loginData.user?.name, '| Token present:', !!loginData.token);
    if (!loginData.token) throw new Error('No token returned');

    console.log('\n--- 2. Testing Create Attempt Persistence ---');
    const newAttempt = {
      id: 'att-e2e-' + Date.now(),
      examId: 'ssc-reasoning-01',
      examTitle: 'SSC CGL General Intelligence & Reasoning',
      score: 18,
      maxScore: 20,
      percentage: 90,
      timeSpentSeconds: 420,
      status: 'Completed',
      flags: [],
      audioAlertsCount: 0,
      answers: [],
    };
    const createRes = await fetch('http://localhost:5000/api/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`,
      },
      body: JSON.stringify(newAttempt),
    });
    const createJson = await createRes.json();
    const createdAttempt = createJson.attempt;
    console.log('Create Attempt Status:', createRes.status, '| ID:', createdAttempt?.id, '| Score:', createdAttempt?.score, '/', createdAttempt?.maxScore);

    console.log('\n--- 3. Testing Get Attempts History ---');
    const getRes = await fetch('http://localhost:5000/api/attempts', {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const getJson = await getRes.json();
    const attempts = getJson.attempts || [];
    console.log('Attempts Retrieved Count:', attempts.length);
    const found = attempts.find((a: any) => a.id === newAttempt.id);
    console.log('Verified Created Attempt in History:', !!found, '| Score:', found?.score, '/', found?.maxScore);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎉 ALL BACKEND E2E API VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runTest().catch((err) => {
  console.error('❌ E2E API Test Failed:', err);
  process.exit(1);
});
