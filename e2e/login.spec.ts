import { test, expect } from '@playwright/test';

test.describe('Inicio de sesión', () => {
  test('un usuario válido puede iniciar sesión y ver el panel', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'PymeLegal' })).toBeVisible();

    await page.getByLabel('Correo electrónico').fill('ariel@pymelegal.cl');
    await page.getByLabel('Contraseña').fill('PymeLegal#2026');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();
  });

  test('credenciales inválidas muestran un mensaje de error y no inician sesión', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('ariel@pymelegal.cl');
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Credenciales inválidas.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('una ruta protegida redirige a login cuando no hay sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
