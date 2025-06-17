// Debugging script to check React mounting
import puppeteer from 'puppeteer';

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Collect console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Collect network failures
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.url()} - ${response.status()}`);
      }
    });
    
    // Navigate and check
    await page.goto('http://localhost:5000/career', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Check if React root exists and has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML : null,
        hasChildren: root ? root.children.length > 0 : false
      };
    });
    
    console.log('Root element analysis:', JSON.stringify(rootContent, null, 2));
    console.log('Console errors:', errors);
    console.log('Network errors:', networkErrors);
    
    // Check for specific React mounting
    const reactMounted = await page.evaluate(() => {
      return window.React !== undefined || document.querySelector('[data-reactroot]') !== null;
    });
    
    console.log('React mounted:', reactMounted);
    
  } catch (error) {
    console.log('Browser automation error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();