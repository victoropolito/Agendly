import { expect, test } from '@playwright/test';

import { buildTenantFixture } from './test-data';

test.describe('Autenticação da equipe', () => {
  test('cadastra uma barbearia, acessa o painel, sai e entra novamente', async ({ page }) => {
    const fixture = buildTenantFixture();

    await page.goto('/register');
    await page.getByLabel('Nome da barbearia').fill(fixture.tenantName);
    await page.getByLabel('Seu nome').fill(fixture.adminName);
    await page.getByLabel('Telefone').fill(fixture.phone);
    await page.getByLabel('E-mail').fill(fixture.email);
    await page.getByLabel('Senha').fill(fixture.password);
    await page.getByRole('button', { name: 'Criar barbearia' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible();

    await page.getByTitle('Sair').first().click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('E-mail').fill(fixture.email);
    await page.getByLabel('Senha').fill(fixture.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible();
  });
});
