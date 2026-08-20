import { expect, test, type Page } from '@playwright/test';

import { buildTenantFixture, uniquePhone } from './test-data';

/** Turns every weekday switch on and sets its time range to 07:00–22:00. */
async function enableAllWeekdays(page: Page): Promise<void> {
  const switches = page.getByRole('switch');
  const dayCount = await switches.count();
  for (let i = 0; i < dayCount; i += 1) {
    const state = await switches.nth(i).getAttribute('data-state');
    if (state !== 'checked') {
      await switches.nth(i).click();
    }
  }

  const timeInputs = page.locator('input[type="time"]');
  const timeInputCount = await timeInputs.count();
  for (let i = 0; i < timeInputCount; i += 2) {
    await timeInputs.nth(i).fill('07:00');
    await timeInputs.nth(i + 1).fill('22:00');
  }
}

test.describe('Fluxo público de agendamento', () => {
  test('admin cadastra serviço, profissional e horários; cliente agenda de ponta a ponta', async ({ page }) => {
    const fixture = buildTenantFixture();
    const serviceName = 'Corte Masculino E2E';
    const professionalName = 'Barbeiro E2E';

    // 1. Cadastro do tenant (admin)
    await page.goto('/register');
    await page.getByLabel('Nome da barbearia').fill(fixture.tenantName);
    await page.getByLabel('Seu nome').fill(fixture.adminName);
    await page.getByLabel('Telefone').fill(fixture.phone);
    await page.getByLabel('E-mail').fill(fixture.email);
    await page.getByLabel('Senha').fill(fixture.password);
    await page.getByRole('button', { name: 'Criar barbearia' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Cadastra um serviço
    await page.getByRole('link', { name: 'Serviços' }).click();
    await expect(page).toHaveURL(/\/services$/);
    await page.getByRole('button', { name: 'Novo serviço' }).click();
    await page.getByLabel('Nome').fill(serviceName);
    await page.getByLabel('Preço (R$)').fill('50');
    await page.getByLabel('Duração (min)').fill('30');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('cell', { name: serviceName })).toBeVisible();

    // 3. Cadastra um profissional vinculado ao serviço
    await page.getByRole('link', { name: 'Profissionais' }).click();
    await expect(page).toHaveURL(/\/professionals$/);
    await page.getByRole('button', { name: 'Novo profissional' }).click();
    await page.getByLabel('Nome').fill(professionalName);
    await page.locator('label', { hasText: serviceName }).getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('cell', { name: professionalName })).toBeVisible();

    // 4. Abre os horários de atendimento do profissional (independentes do horário da barbearia)
    await page.getByTitle('Horários').click();
    await expect(page.getByRole('heading', { name: `Horários de ${professionalName}` })).toBeVisible();
    await enableAllWeekdays(page);
    await page.getByRole('button', { name: 'Salvar horários' }).click();
    await expect(page.getByText('Horários atualizados.')).toBeVisible();

    // 5. Abre o horário de funcionamento da barbearia
    await page.getByRole('link', { name: 'Configurações' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await enableAllWeekdays(page);
    await page.getByRole('button', { name: 'Salvar horários' }).click();
    await expect(page.getByText('Horários de funcionamento atualizados.')).toBeVisible();

    // 6. Sai da conta de administrador e acessa a página pública como cliente
    await page.getByTitle('Sair').first().click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto(`/barbearia/${fixture.tenantSlug}`);
    await expect(page.getByRole('heading', { name: fixture.tenantName })).toBeVisible();
    await page.getByRole('link', { name: 'Agendar horário' }).click();
    await expect(page).toHaveURL(new RegExp(`/barbearia/${fixture.tenantSlug}/agendar$`));

    // 7. Fluxo de agendamento: serviço -> qualquer profissional -> data (hoje) -> horário
    await page.getByText(serviceName).click();
    await page.getByText('Qualquer profissional disponível').click();
    await page.getByRole('button', { name: 'Ver horários' }).click();

    const firstSlot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15_000 });
    await firstSlot.click();

    // 8. Cria conta de cliente (identidade separada da equipe) e confirma o agendamento
    const customerPhone = uniquePhone();
    await expect(page.getByRole('heading', { name: 'Só mais um passo' })).toBeVisible();
    await page.getByLabel('Nome').fill('Cliente E2E');
    await page.getByLabel('WhatsApp').fill(customerPhone);
    await page.getByLabel('Crie uma senha').fill('senha-cliente-123');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Confirmar agendamento' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

    // 9. Verifica que o agendamento aparece na área do cliente
    await expect(page).toHaveURL(new RegExp(`/barbearia/${fixture.tenantSlug}/conta$`));
    await expect(page.getByText('Próximos agendamentos')).toBeVisible();
    await expect(page.getByText(serviceName)).toBeVisible();
  });
});
