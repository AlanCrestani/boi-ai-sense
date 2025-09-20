import { chromium } from 'playwright';

async function checkDesviosPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capturar mensagens do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    } else if (msg.type() === 'warn') {
      console.log('⚠️ Console Warn:', msg.text());
    }
  });

  // Capturar erros de página
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  console.log('📱 Navegando para http://localhost:8080/desvios...');

  try {
    // Navegar para a página
    const response = await page.goto('http://localhost:8080/desvios', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log('📊 Status HTTP:', response.status());

    // Aguardar um pouco para que React carregue
    await page.waitForTimeout(2000);

    // Verificar o título da página
    const title = await page.title();
    console.log('📄 Título:', title);

    // Verificar se há elementos de erro visíveis
    const errorElements = await page.$$('.error, .text-red-500, [role="alert"]');
    if (errorElements.length > 0) {
      console.log('⚠️ Elementos de erro encontrados:', errorElements.length);
      for (const elem of errorElements) {
        const text = await elem.textContent();
        console.log('   -', text?.slice(0, 100));
      }
    }

    // Verificar se há loading spinners
    const loadingElements = await page.$$('.animate-spin, .loading, .spinner');
    console.log('🔄 Elementos de loading:', loadingElements.length);

    // Verificar elementos principais da página Analytics
    const hasHeader = await page.$('h1') !== null;
    console.log('📝 Header principal encontrado:', hasHeader);

    const hasTabs = await page.$$('[role="tab"]');
    console.log('🗂️ Abas encontradas:', hasTabs.length);

    const hasCards = await page.$$('.card, [class*="card"]');
    console.log('📊 Cards encontrados:', hasCards.length);

    // Verificar se há gráficos (canvas ou SVG)
    const hasCharts = await page.$$('canvas, svg');
    console.log('📈 Elementos de gráfico:', hasCharts.length);

    // Verificar se a página está em estado de carregamento
    const loadingText = await page.evaluate(() => {
      const loadingEl = document.querySelector('*');
      return loadingEl?.textContent?.includes('Carregando') ||
             loadingEl?.textContent?.includes('Loading') ||
             document.querySelector('.animate-spin') !== null;
    });
    console.log('⏳ Em estado de carregamento:', loadingText);

    // Capturar parte do conteúdo da página
    const bodyText = await page.evaluate(() => {
      return document.body.textContent?.slice(0, 300) || 'Corpo vazio';
    });
    console.log('📝 Conteúdo (primeiros 300 chars):', bodyText);

    // Tirar screenshot
    await page.screenshot({
      path: '/home/conectaboi-dev/boi-ai-sense-main/public/desvios_screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvo em public/desvios_screenshot.png');

  } catch (error) {
    console.log('❌ Erro ao acessar a página:', error.message);
  } finally {
    await browser.close();
  }
}

checkDesviosPage();