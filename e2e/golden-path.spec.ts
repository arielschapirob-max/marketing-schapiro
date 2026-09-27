import { test, expect } from '@playwright/test';

const ORG_NAME = `E2E Comercio Ejemplo ${Date.now()}`;
const TRANSCRIPT = `Somos una tienda online. Los clientes hacen checkout con la pasarela de pago Webpay y guardamos su
historial de compras. Usamos Mailchimp para email marketing y Google Analytics para medir el tráfico del sitio.`;

test.describe.serial('Flujo completo: organización → diagnóstico → cuestionario → revisión → exportación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('ariel@pymelegal.cl');
    await page.getByLabel('Contraseña').fill('PymeLegal#2026');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('crea una organización', async ({ page }) => {
    await page.goto('/organizaciones/nueva');
    await page.getByLabel('Razón social *').fill(ORG_NAME);
    await page.getByRole('button', { name: 'Crear organización' }).click();
    await expect(page).toHaveURL(/\/organizaciones\/[a-z0-9]+$/);
    await expect(page.getByRole('heading', { name: ORG_NAME })).toBeVisible();
  });

  test('crea un diagnóstico, carga una transcripción y ejecuta el análisis', async ({ page }) => {
    await page.goto('/organizaciones');
    await page.getByRole('link', { name: new RegExp(ORG_NAME) }).click();

    await page.getByLabel('Título del diagnóstico *').fill('Diagnóstico E2E');
    await page.getByRole('button', { name: 'Crear diagnóstico' }).click();
    await expect(page).toHaveURL(/\/diagnosticos\/[a-z0-9]+\/carga$/);

    await page.getByLabel('Transcripción de la reunión').fill(TRANSCRIPT);
    await page.getByRole('button', { name: 'Guardar transcripción' }).click();

    await page.getByRole('button', { name: 'Ejecutar análisis completo' }).click();
    await expect(page).toHaveURL(/\/mapa$/, { timeout: 30_000 });
    await expect(page.getByText('Tratamientos de datos')).toBeVisible();
  });

  test('genera el cuestionario, ejecuta la revisión y exporta el diagnóstico', async ({ page }) => {
    await page.goto('/organizaciones');
    await page.getByRole('link', { name: new RegExp(ORG_NAME) }).click();
    await page.getByRole('link', { name: 'Diagnóstico E2E' }).click();
    await page.waitForURL(/\/diagnosticos\/[a-z0-9]+\/carga$/);

    const diagnosisUrl = page.url().replace(/\/carga$/, '');

    await page.goto(`${diagnosisUrl}/cuestionario`);
    await page.getByRole('button', { name: 'Generar cuestionario' }).click();
    await expect(page.getByText(/pregunta\(s\) activa\(s\)/)).toBeVisible({ timeout: 15_000 });

    await page.goto(`${diagnosisUrl}/revision`);
    await page.getByRole('button', { name: 'Ejecutar revisión automática' }).click();
    await expect(page.getByText('Controles de revisión (CHECK 1–20)')).toBeVisible({ timeout: 15_000 });

    await page.goto(`${diagnosisUrl}/exportacion`);
    await page.getByRole('button', { name: 'Generar JSON' }).click();
    await expect(page.getByText('JSON', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Descargar' }).first()).toBeVisible();
  });
});
