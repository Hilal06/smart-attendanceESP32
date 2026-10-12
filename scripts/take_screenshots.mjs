import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/faulfedora/Documents/MyProjects/smartAttend/smart-attendanceESP32/documentation/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Clean old numbered files if needed
const existing = fs.readdirSync(outDir);
for (const file of existing) {
  if (file.endsWith('.png')) {
    fs.unlinkSync(path.join(outDir, file));
  }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // 1. Login Page
  console.log('1. Capturing Login page...');
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_login.png') });

  // 2. Register Page
  console.log('2. Capturing Register page...');
  await page.goto('http://localhost/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_register.png') });

  // 3. Login as Admin
  console.log('3. Logging in as Admin (admin@smart.com)...');
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@smart.com');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Admin logged in, URL:', page.url());
  await new Promise(r => setTimeout(r, 1500));

  // 4. Admin Dashboard (Academic Studio)
  console.log('4. Capturing Admin Dashboard (Academic Studio)...');
  await page.screenshot({ path: path.join(outDir, '03_dashboard_academic.png') });

  // 5. Admin Dashboard (Command Center)
  console.log('5. Capturing Admin Dashboard (Command Center)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Command Center'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '04_dashboard_command_center.png') });

  // 6. Staff Profiles (/profiles)
  console.log('6. Capturing Staff Profiles directory (/profiles)...');
  await page.goto('http://localhost/profiles', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '05_profiles_staff.png') });

  // 7. Staff Profile Detail Modal
  console.log('7. Opening and capturing Staff Profile Detail Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && (b.textContent.includes('Lihat Profil') || b.textContent.includes('View Profile')));
    if (btn) {
      btn.click();
    } else {
      const iconBtn = document.querySelector('button[title*="Profil"], button[aria-label*="Profil"]');
      if (iconBtn) iconBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '06_profile_staff_detail.png') });
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // 8. Students (/students)
  console.log('8. Capturing Students directory (/students)...');
  await page.goto('http://localhost/students', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '07_students.png') });

  // 9. Student Profile Detail Modal
  console.log('9. Opening and capturing Student Profile Detail Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && (b.textContent.includes('Lihat Profil') || b.textContent.includes('View Profile')));
    if (btn) {
      btn.click();
    } else {
      const iconBtn = document.querySelector('button[title*="Profil"], button[aria-label*="Profil"]');
      if (iconBtn) iconBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '08_profile_student_detail.png') });
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // 10. Reports (/reports)
  console.log('10. Capturing Reports & AI Analytics (/reports)...');
  await page.goto('http://localhost/reports', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '09_reports_analytics.png') });

  // 11. Requests (/requests)
  console.log('11. Capturing Requests (/requests)...');
  await page.goto('http://localhost/requests', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '10_requests.png') });

  // 12. Announcements (/announcements)
  console.log('12. Capturing Announcements (/announcements)...');
  await page.goto('http://localhost/announcements', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '11_announcements.png') });

  // 13. Settings (/settings)
  console.log('13. Capturing Settings (/settings)...');
  await page.goto('http://localhost/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '12_settings.png') });

  // 14. Admin Personal Profile (/profile)
  console.log('14. Capturing Admin Personal Profile (/profile)...');
  await page.goto('http://localhost/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '13_my_profile_admin.png') });

  // CDP Session for clean cookie management
  const cdp = await page.target().createCDPSession();

  // 15. Login as Staff/Teacher (ali.utomo@guru.smartattend.sch.id)
  console.log('15. Logging out Admin and logging in as Staff/Teacher...');
  await cdp.send('Network.clearBrowserCookies');
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'ali.utomo@guru.smartattend.sch.id');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);
  console.log('Teacher logged in, URL:', page.url());
  await new Promise(r => setTimeout(r, 1500));

  console.log('Capturing Staff/Teacher Personal Profile (/profile)...');
  await page.goto('http://localhost/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '14_staff_personal_profile.png') });

  // 16. Login as Student (agus.purwandari12@siswa.smartattend.sch.id)
  console.log('16. Logging out Teacher and logging in as Student...');
  await cdp.send('Network.clearBrowserCookies');
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'agus.purwandari12@siswa.smartattend.sch.id');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);
  console.log('Student logged in, URL:', page.url());
  await new Promise(r => setTimeout(r, 1500));

  console.log('Capturing Student Dashboard (/)...');
  await page.screenshot({ path: path.join(outDir, '15_student_dashboard.png') });

  console.log('Capturing Student Personal Profile (/profile)...');
  await page.goto('http://localhost/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '16_student_personal_profile.png') });

  console.log('All screenshots completed successfully!');
  await browser.close();
})();
