import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseExcelOrCsv,
  parseMarkdown,
  validateAndSanitizeProductRow,
  getSampleCsvTemplate,
} from '../src/lib/catalog/bulk-importer.ts';

test('Bulk Importer: Validação estrita de dados obrigatórios', () => {
  // Caso 1: Linha sem preço -> Deve ser REJEITADA
  const semPreco = validateAndSanitizeProductRow({
    nome: 'Vestido Vermelho',
    preco: '',
    categoria: 'Vestidos',
    descricao: 'Vestido lindo',
    imagem: 'https://exemplo.com/foto.jpg',
  }, 1);
  assert.equal(semPreco.product, null);
  assert.ok(semPreco.reasons.some((r) => r.includes('Preço obrigatório')));

  // Caso 2: Linha com preço zero -> Deve ser REJEITADA
  const precoZero = validateAndSanitizeProductRow({
    nome: 'Vestido Vermelho',
    preco: '0',
    categoria: 'Vestidos',
    descricao: 'Vestido lindo',
    imagem: 'https://exemplo.com/foto.jpg',
  }, 2);
  assert.equal(precoZero.product, null);
  assert.ok(precoZero.reasons.some((r) => r.includes('Preço obrigatório')));

  // Caso 3: Linha sem imagem -> Deve ser REJEITADA
  const semImagem = validateAndSanitizeProductRow({
    nome: 'Vestido Vermelho',
    preco: '149.90',
    categoria: 'Vestidos',
    descricao: 'Vestido lindo',
    imagem: '',
  }, 3);
  assert.equal(semImagem.product, null);
  assert.ok(semImagem.reasons.some((r) => r.includes('Foto/Imagem obrigatório')));

  // Caso 4: Linha sem categoria -> Deve ser REJEITADA
  const semCategoria = validateAndSanitizeProductRow({
    nome: 'Vestido Vermelho',
    preco: '149.90',
    categoria: '',
    descricao: 'Vestido lindo',
    imagem: 'https://exemplo.com/foto.jpg',
  }, 4);
  assert.equal(semCategoria.product, null);
  assert.ok(semCategoria.reasons.some((r) => r.includes('Categoria/Tópico obrigatório')));

  // Caso 5: Linha com todos os dados preenchidos -> Deve ser ACEITA com sucesso
  const completo = validateAndSanitizeProductRow({
    nome: 'Vestido Floral Elegante',
    preco: 'R$ 189,90',
    categoria: 'Vestidos',
    descricao: 'Vestido floral midi em viscose com caimento perfeito',
    imagem: 'https://exemplo.com/foto.jpg',
    estoque: '4',
    tamanhos: 'P, M, G',
  }, 5);
  assert.ok(completo.product !== null);
  assert.equal(completo.product.name, 'Vestido Floral Elegante');
  assert.equal(completo.product.price, 189.90);
  assert.equal(completo.product.category, 'Vestidos');
  assert.equal(completo.product.stock, 4);
  assert.deepEqual(completo.product.sizes, ['P', 'M', 'G']);
});

test('Bulk Importer: Parse de CSV com linhas válidas e inválidas', () => {
  const csvContent = `Nome,Preço,Categoria,Estoque,Descrição,Imagem
Blusa Amarela,89.90,Blusas,5,Blusa gola V em viscose,https://exemplo.com/blusa.jpg
Item Sem Preco,,Blusas,2,Descricao de teste,https://exemplo.com/foto.jpg
Vestido Longo,199.90,Vestidos,3,Vestido longo festa,https://exemplo.com/vestido.jpg
Item Sem Foto,120.00,Calças,1,Calça alfaiataria,`;

  const result = parseExcelOrCsv(csvContent);
  assert.equal(result.totalParsed, 4);
  assert.equal(result.validProducts.length, 2);
  assert.equal(result.rejectedRows.length, 2);

  // Verifica que os válidos foram processados
  assert.equal(result.validProducts[0].name, 'Blusa Amarela');
  assert.equal(result.validProducts[0].price, 89.90);
  assert.equal(result.validProducts[1].name, 'Vestido Longo');
  assert.equal(result.validProducts[1].price, 199.90);

  // Verifica os motivos das rejeições
  assert.ok(result.rejectedRows[0].reasons.some((r) => r.includes('Preço')));
  assert.ok(result.rejectedRows[1].reasons.some((r) => r.includes('Imagem')));
});

test('Bulk Importer: Parse de Tabela Markdown', () => {
  const markdownTable = `| Nome | Preço | Categoria | Estoque | Descrição | Imagem |
| --- | --- | --- | --- | --- | --- |
| Cropped Canelado | 49,90 | Blusas | 10 | Cropped tecido canelado premium | https://exemplo.com/cropped.jpg |
| Short Jeans | 99,00 | Shorts | 4 | Short cintura alta desfiado | https://exemplo.com/short.jpg |
| Incompleto Sem Valor | 0 | Shorts | 2 | Sem preco valido | https://exemplo.com/short.jpg |`;

  const result = parseMarkdown(markdownTable);
  assert.equal(result.totalParsed, 3);
  assert.equal(result.validProducts.length, 2);
  assert.equal(result.rejectedRows.length, 1);
  assert.equal(result.validProducts[0].name, 'Cropped Canelado');
  assert.equal(result.validProducts[0].price, 49.90);
  assert.equal(result.validProducts[1].name, 'Short Jeans');
  assert.equal(result.validProducts[1].price, 99.00);
});

test('Bulk Importer: API POST /api/catalog/import com rejeição estrita de incompletos e inclusão dos válidos', async () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${BASE_URL}/api/catalog/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      catalogSlug: 'minha-loja',
      csvText: `Nome,Preço,Categoria,Estoque,Descrição,Imagem
Regata Cetim Premium,79.90,Regatas,5,Regata em cetim toque suave,https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800
Sem Preco Nem Imagem,,,1,,
Calça Pantalona Linho,169.90,Calças,3,Calça pantalona linho puro alfaiataria,https://images.unsplash.com/photo-1572804013309-8472506b3a04?w=800`,
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.importedCount, 2);
  assert.equal(data.rejectedCount, 1);
  assert.ok(data.rejectedRows[0].reasons.length > 0);

  // Verifica que o catálogo foi atualizado via GET /api/catalog
  const catRes = await fetch(`${BASE_URL}/api/catalog`);
  const catData = await catRes.json();
  const products = catData.catalog.products || [];

  const foundRegata = products.find((p) => p.name === 'Regata Cetim Premium');
  assert.ok(foundRegata, 'Regata importada deve constar no catálogo');
  assert.equal(foundRegata.price, 79.90);
  assert.equal(foundRegata.category, 'Regatas');

  const foundPantalona = products.find((p) => p.name === 'Calça Pantalona Linho');
  assert.ok(foundPantalona, 'Pantalona importada deve constar no catálogo');
  assert.equal(foundPantalona.price, 169.90);
});
