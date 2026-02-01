import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:4200';
const OUTPUT_DIR = './screenshots';

const screens = [
  { path: '/dashboard', name: '1-dashboard' },
  { path: '/log', name: '2-meal-log' },
  { path: '/recommendations', name: '3-recommendations' },
  { path: '/diet-plan', name: '4-diet-plan' },
  { path: '/onboarding', name: '5-onboarding' },
  { path: '/auth/login', name: '6-login' },
];

async function takeScreenshots() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  
  for (const screen of screens) {
    console.log(`📸 Capturing ${screen.name}...`);
    await page.goto(`${BASE_URL}${screen.path}`, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    // Wait extra time for styles to load
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ 
      path: join(OUTPUT_DIR, `${screen.name}.png`),
      fullPage: false 
    });
  }
  
  // Mobile view of dashboard
  console.log('📱 Capturing mobile view...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ 
    path: join(OUTPUT_DIR, '7-dashboard-mobile.png'),
    fullPage: false 
  });
  
  await browser.close();
  console.log('✅ Screenshots saved to ./screenshots/');
}

takeScreenshots().catch(console.error);
