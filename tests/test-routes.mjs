const routes = [
  '/',
  '/login',
  '/dashboard',
  '/planos',
  '/minha-loja',
  '/minha-loja/blusas',
  '/minha-loja/categoria/produto-exemplo',
  '/minha-loja/produto-exemplo',
  '/c/minha-loja',
  '/checkout/pedido-exemplo',
  '/settings/ia',
  '/settings/logistica',
  '/settings/pagamentos',
  '/api/simulator',
  '/api/auth/instagram/url',
  '/api/auth/instagram/status',
];

async function testAll() {
  console.log('Testing Vitryne routes on http://localhost:3000...\n');
  let hasError = false;

  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      const text = await res.text();
      const statusOk = res.status >= 200 && res.status < 400;
      console.log(`${statusOk ? '✅' : '❌'} [${res.status}] ${route} (${text.length} bytes)`);
      if (!statusOk) hasError = true;
    } catch (err) {
      console.error(`❌ [FAILED] ${route}: ${err.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log('\nAll routes rendered cleanly with HTTP 200!');
  }
}

testAll();
