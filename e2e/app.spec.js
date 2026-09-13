import { expect, test } from '@playwright/test';

const sections = [
  ['الأسماء', 'اقتراح اسم مولود', 'names-light.png'],
  ['الحاسبة', 'الحاسبة', 'calculator-light.png'],
  ['الأبراج', 'الأبراج وخريطة الميلاد', 'zodiac-light.png'],
  ['المرجع', 'المرجع والمنهج', 'reference-light.png'],
];

test('كل الشاشات تُعرض بدون أخطاء جافاسكربت', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
  for (const [nav, heading] of sections) {
    await page.getByRole('button', { name: nav, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('الحاسبة تحسب فور الكتابة', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'الحاسبة', exact: true }).click();
  await page.locator('#text').fill('محمد');
  await expect(page.locator('.hero-number')).toContainText('٩٢');
  await expect(page.locator('.sum-value')).toContainText('٩٢');
});

test('التاريخ الهجري يظهر بجانب الميلادي', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'الأبراج', exact: true }).click();
  await page.getByRole('button', { name: 'خريطة الميلاد' }).click();
  await page.locator('input[data-birth-field="birthYear"]').fill('1990');
  await page.locator('select[data-birth-field="birthMonth"]').selectOption('4');
  await page.locator('select[data-birth-field="birthDay"]').selectOption('1');
  await expect(page.locator('.hijri-note')).toContainText('رمضان');
});

test('الوضع الداكن يتبدل ويُحفظ ولقطات للشاشات', async ({ page }) => {
  await page.goto('/');
  for (const [nav, , shot] of sections) {
    await page.getByRole('button', { name: nav, exact: true }).click();
    await page.locator('.card').first().waitFor();
    await page.screenshot({ path: `e2e/screenshots/${shot}` });
  }
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const [nav, , shot] of sections) {
    await page.getByRole('button', { name: nav, exact: true }).click();
    await page.locator('.card').first().waitFor();
    await page.screenshot({ path: `e2e/screenshots/${shot.replace('-light', '-dark')}` });
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
