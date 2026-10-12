import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/faulfedora/Documents/MyProjects/smartAttend/smart-attendanceESP32/documentation/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log('1. Capturing Login page...');
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_login.png') });

  console.log('2. Capturing Register page...');
  await page.goto('http://localhost/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_register.png') });

  console.log('3. Logging in as Admin...');
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@smart.com');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Current URL after login:', page.url());
  await new Promise(r => setTimeout(r, 1500));

  console.log('4. Capturing Dashboard (Academic Studio default)...');
  await page.screenshot({ path: path.join(outDir, '03_dashboard_academic.png') });

  // Let's capture variants if buttons exist
  const variantButtons = await page.$$('button');
  for (const btn of variantButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Command Center')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, '03_dashboard_command_center.png') });
      break;
    }
  }

  console.log('5. Capturing Staff Profiles (/profiles)...');
  await page.goto('http://localhost/profiles', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '04_profiles_staff.png') });

  console.log('6. Capturing Students (/students)...');
  await page.goto('http://localhost/students', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '05_students.png') });

  console.log('7. Capturing Reports & AI Analytics (/reports)...');
  await page.goto('http://localhost/reports', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '06_reports_analytics.png') });

  console.log('8. Capturing Requests (/requests)...');
  await page.goto('http://localhost/requests', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '07_requests.png') });

  console.log('9. Capturing Announcements (/announcements)...');
  await page.goto('http://localhost/announcements', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '08_announcements.png') });

  console.log('10. Capturing Settings (/settings)...');
  await page.goto('http://localhost/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '09_settings.png') });

  console.log('11. Capturing My Profile (/profile)...');
  await page.goto('http://localhost/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '10_my_profile.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
})();
