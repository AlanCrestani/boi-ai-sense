import { chromium } from 'playwright';

async function debugDesviosPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capturar TODOS os logs do console
  const consoleLogs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Capturar erros de rede
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`❌ HTTP Error: ${response.status()} - ${response.url()}`);
    }
  });

  // Capturar erros de JavaScript
  page.on('pageerror', error => {
    console.log('💥 JavaScript Error:', error.message);
  });

  console.log('🌐 Navegando para http://localhost:8080/desvios...');

  try {
    await page.goto('http://localhost:8080/desvios', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Aguardando 5 segundos para capturar logs...');
    await page.waitForTimeout(5000);

    // Verificar se há dados sendo carregados
    const hasLoadingSpinners = await page.$$('.animate-spin');
    console.log('🔄 Elementos de loading ativos:', hasLoadingSpinners.length);

    // Verificar mensagens de "nenhum resultado"
    const noResultsMessages = await page.evaluate(() => {
      const messages = [];
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('nenhum resultado') || text.includes('não há dados')) {
          messages.push({
            tagName: el.tagName,
            className: el.className,
            text: el.textContent?.slice(0, 100)
          });
        }
      });
      return messages;
    });

    console.log('🔍 Mensagens de "nenhum resultado" encontradas:', noResultsMessages.length);
    noResultsMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. <${msg.tagName} class="${msg.className}"> ${msg.text}`);
    });

    // Verificar estado do hook no localStorage/sessionStorage
    const storageData = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage }
      };
    });

    console.log('💾 Dados de storage:', Object.keys(storageData.localStorage).length, 'itens no localStorage');

    // Tentar executar uma query diretamente no Supabase (se possível)
    const supabaseTest = await page.evaluate(async () => {
      try {
        // Verificar se o supabase está disponível globalmente
        if (window.supabase) {
          const result = await window.supabase
            .from('staging_02_desvio_carregamento')
            .select('count(*)', { count: 'exact' });
          return { success: true, data: result };
        } else {
          return { success: false, error: 'Supabase não encontrado no window' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('🗄️ Teste direto Supabase:', supabaseTest);

    // Salvar logs em arquivo para análise
    const logSummary = {
      timestamp: new Date().toISOString(),
      consoleLogs,
      noResultsMessages,
      storageData: {
        localStorageKeys: Object.keys(storageData.localStorage),
        sessionStorageKeys: Object.keys(storageData.sessionStorage)
      },
      supabaseTest
    };

    await page.screenshot({
      path: '/home/conectaboi-dev/boi-ai-sense-main/public/debug_desvios.png',
      fullPage: true
    });

    console.log('📸 Screenshot debug salvo em public/debug_desvios.png');
    console.log('📋 Total de logs capturados:', consoleLogs.length);

    // Agrupar logs por tipo
    const logsByType = consoleLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Resumo dos logs:', logsByType);

  } catch (error) {
    console.log('❌ Erro durante o debug:', error.message);
  } finally {
    await browser.close();
  }
}

debugDesviosPage();