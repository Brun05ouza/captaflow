import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { config } from 'dotenv';
import { randomBytes } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { db, getPool } from '../../src/db';
import {
  user,
  account,
  workspaces,
  workspaceMembers,
  leads,
  leadEvents,
  leadScoreFactors,
  demoSessions,
} from '../../src/db/schema';
import { scoreLead } from '../../src/features/scoring/engine';
config({ path: '.env.local' });
const origin = 'http://localhost:3000';
const fixtureId = crypto.randomUUID();
const email = `e2e-${fixtureId}@example.com`;
const password = randomBytes(24).toString('base64url');
let workspaceId: string;
let otherWorkspace: string;
let testLead: string;
let foreignLead: string;
let token: string;
let liveId: string;
test.beforeAll(async () => {
  await db().transaction(async (tx) => {
    await tx.insert(user).values({ id: fixtureId, name: 'Workspace de testes', email });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: fixtureId,
      userId: fixtureId,
      providerId: 'credential',
      password: await hashPassword(password),
    });
    const [w] = await tx
      .insert(workspaces)
      .values({ name: 'CaptaFlow · Demonstração', slug: `e2e-${fixtureId}` })
      .returning();
    workspaceId = w.id;
    await tx.insert(workspaceMembers).values({ userId: fixtureId, workspaceId });
    const [other] = await tx
      .insert(workspaces)
      .values({ name: 'Isolamento de testes', slug: `other-${fixtureId}` })
      .returning();
    otherWorkspace = other.id;
    const data = {
      name: 'Contato privado externo',
      interest: 'Site',
      urgency: 'high',
      budgetRange: 'unknown',
    };
    const s = scoreLead(data);
    const [f] = await tx
      .insert(leads)
      .values({
        ...data,
        workspaceId: otherWorkspace,
        source: 'Manual',
        score: s.score,
        temperature: s.temperature,
        scoreReason: s.reason,
      })
      .returning();
    foreignLead = f.id;
  });
});
test.afterAll(async () => {
  if (workspaceId) await db().delete(workspaces).where(eq(workspaces.id, workspaceId));
  if (otherWorkspace) await db().delete(workspaces).where(eq(workspaces.id, otherWorkspace));
  await db().delete(user).where(eq(user.id, fixtureId));
  await getPool().end();
});
test('CRM, autorização, Live e responsividade no Neon real', async ({ page, context, request }) => {
  test.setTimeout(240000);
  const browserErrors: string[] = [];
  page.on('pageerror', (e) => browserErrors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('hydrat'))
      browserErrors.push(message.text());
  });
  const anonymous = await request.get('/api/leads');
  expect(anonymous.status()).toBe(401);
  const unauthWrite = await request.post('/api/leads', { headers: { origin }, data: {} });
  expect(unauthWrite.status()).toBe(401);
  const crossOrigin = await request.post('/api/leads', {
    headers: { origin: 'https://evil.example' },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'artifacts/login-desktop.png', fullPage: true, caret: 'initial' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/login-mobile.png', fullPage: true, caret: 'initial' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar no workspace' }).click();
  await expect(page).toHaveURL(/app\/dashboard/, { timeout: 30000 });
  await expect(page.getByText('Seus contatos começam aqui')).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Principal' });
  await expect(navigation.getByRole('link')).toHaveCount(4);
  await expect(navigation.getByRole('link', { name: 'Lead Scoring' })).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: 'Inteligência Artificial' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Como funciona o CaptaFlow' })).toBeVisible();
  await page.getByRole('button', { name: 'Dispensar explicação' }).click();
  await expect(page.getByRole('heading', { name: 'Como funciona o CaptaFlow' })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Como funciona o CaptaFlow', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Como funciona o CaptaFlow', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Como funciona o CaptaFlow' })).toBeVisible();
  await page.screenshot({
    path: 'artifacts/dashboard-empty.png',
    fullPage: true,
    caret: 'initial',
  });
  const api = context.request;
  const bad = await api.get(`/api/leads/${foreignLead}`);
  expect(bad.status()).toBe(404);
  const badEdit = await api.patch(`/api/leads/${foreignLead}`, {
    headers: { origin },
    data: { action: 'stage', stage: 'won' },
  });
  expect(badEdit.status()).toBe(404);
  const badDelete = await api.delete(`/api/leads/${foreignLead}`, { headers: { origin } });
  expect(badDelete.status()).toBe(404);
  await page.getByRole('button', { name: 'Novo lead', exact: true }).click();
  await page.getByLabel('Nome *', { exact: true }).fill('Ana de Teste');
  await page.getByLabel('Empresa', { exact: true }).fill('Estúdio Aurora');
  await page.getByLabel('E-mail', { exact: true }).fill('ana@example.com');
  await page.getByLabel('Segmento', { exact: true }).fill('Design');
  await page.getByLabel('Serviço de interesse *').fill('Website institucional');
  await page.getByLabel('Urgência', { exact: true }).selectOption('high');
  await page.getByLabel('Faixa de investimento').selectOption('under_2k');
  await page
    .getByLabel('Problema ou objetivo do contato')
    .fill('Precisa organizar os contatos recebidos pelo site da empresa.');
  await page.getByRole('button', { name: 'Salvar lead', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Ana de Teste', { exact: true })).toBeVisible();
  const listing = await (await api.get('/api/leads?q=Ana')).json();
  expect(listing.total).toBe(1);
  testLead = listing.rows[0].id;
  expect(listing.rows[0].score).toBe(100);
  await page.goto(`/app/leads/${testLead}`);
  await expect(page.getByRole('heading', { name: 'Ana de Teste' })).toBeVisible();
  await page.getByRole('button', { name: 'Editar lead', exact: true }).click();
  await page.getByLabel('Urgência', { exact: true }).selectOption('low');
  await page.getByRole('button', { name: 'Salvar lead', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  const edited = await (await api.get(`/api/leads/${testLead}`)).json();
  expect(edited.score).toBe(55);
  await expect(page.locator('.large-score')).toContainText('55');
  await page.getByText('Como funciona a classificação?', { exact: true }).click();
  await expect(
    page.getByText(/Empresa, nome e dados de contato não acrescentam pontos/),
  ).toBeVisible();
  await page.screenshot({
    path: 'artifacts/lead-priority-desktop.png',
    fullPage: true,
    caret: 'initial',
  });
  await page.getByLabel('Alterar etapa comercial').selectOption('won');
  await expect(page.getByText('Etapa alterada de Novo para Ganho.')).toBeVisible();
  await page.getByLabel('Adicionar anotação').fill('Contato realizado. Proposta aprovada.');
  await page.getByRole('button', { name: 'Salvar anotação' }).click();
  await expect(
    page.locator('.timeline').getByText('Contato realizado. Proposta aprovada.', { exact: true }),
  ).toBeVisible();
  expect(
    (await (await api.get('/api/leads?stage=won&temperature=cold&source=Manual')).json()).total,
  ).toBe(1);
  expect((await (await api.get('/api/leads?stage=new')).json()).total).toBe(0);
  const [history, factors] = await Promise.all([
    db().select().from(leadEvents).where(eq(leadEvents.leadId, testLead)),
    db()
      .select()
      .from(leadScoreFactors)
      .where(
        and(
          eq(leadScoreFactors.leadId, testLead),
          eq(leadScoreFactors.createdAt, new Date(edited.scoredAt)),
        ),
      ),
  ]);
  expect(history.length).toBeGreaterThanOrEqual(4);
  expect(factors.reduce((s, f) => s + f.points, 0)).toBe(55);
  const insufficientResponse = await api.post('/api/leads', {
    headers: { origin },
    data: {
      name: 'Contato sem contexto',
      email: 'incomplete@example.com',
      phone: '',
      company: 'Empresa',
      segment: 'Serviços',
      interest: 'teste',
      urgency: 'high',
      budgetRange: 'over_10k',
      source: 'Manual',
      notes: 'teste',
    },
  });
  expect(insufficientResponse.status()).toBe(201);
  const insufficient = await insufficientResponse.json();
  expect(insufficient.temperature).toBe('insufficient');
  expect(insufficient.score).toBe(0);
  await page.goto(`/app/leads/${insufficient.id}`);
  await expect(page.getByText('Dados insuficientes', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'artifacts/lead-insufficient-mobile.png',
    fullPage: true,
    caret: 'initial',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await api.delete(`/api/leads/${insufficient.id}`, { headers: { origin } });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/app/live');
  await page.getByLabel('Nome da apresentação').fill('Apresentação de teste');
  await page.getByRole('button', { name: 'Iniciar apresentação', exact: true }).click();
  await expect(page.locator('.session-status')).toContainText('Sessão aberta');
  const snap = await (await api.get('/api/live')).json();
  token = snap.current.token;
  liveId = snap.current.id;
  expect(token.length).toBe(43);
  expect(JSON.stringify(snap)).not.toContain('ana@example.com');
  await expect(page.locator('.qr-code svg')).toBeVisible();
  const participant = await context.newPage();
  await participant.setViewportSize({ width: 390, height: 844 });
  await participant.goto(`/demo/${token}`);
  await participant.getByLabel('Como podemos chamar você?').fill('Bia');
  await participant.getByLabel('Qual serviço você procura?').fill('Automação de vendas');
  await participant.getByLabel('Qual seu nível de urgência?').selectOption('high');
  await participant.getByLabel('Qual faixa de investimento considera?').selectOption('under_2k');
  await participant
    .getByLabel('Qual problema deseja resolver?')
    .fill('Quero organizar os contatos recebidos.');
  await participant.getByRole('checkbox').check();
  expect(
    (
      await new AxeBuilder({ page: participant })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await participant.screenshot({
    path: 'artifacts/public-mobile.png',
    fullPage: true,
    caret: 'initial',
  });
  await participant.getByRole('button', { name: 'Ver minha classificação' }).click();
  await expect(
    participant.getByRole('heading', { name: 'Seu interesse já virou uma oportunidade.' }),
  ).toBeVisible();
  await expect(page.getByText('Bia', { exact: true })).toBeVisible({ timeout: 15000 });
  const live = await (await api.get('/api/live')).json();
  expect(live.count).toBe(1);
  expect(live.entries[0].score).toBe(100);
  expect(live.entries[0].email).toBeUndefined();
  expect(live.entries[0].notes).toBeUndefined();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'artifacts/live-desktop.png', fullPage: true, caret: 'initial' });
  const publicData = {
    name: 'Pedro',
    interest: 'Website',
    urgency: 'high',
    budgetRange: 'under_2k',
    notes: 'Mais vendas online',
    consent: true,
  };
  const bot = await request.post(`/api/demo/${token}`, {
    headers: { origin },
    data: { ...publicData, website: 'spam' },
  });
  expect(bot.status()).toBe(400);
  const noConsent = await request.post(`/api/demo/${token}`, {
    headers: { origin },
    data: { ...publicData, consent: false },
  });
  expect(noConsent.status()).toBe(400);
  const invalid = await request.post('/api/demo/invalid', {
    headers: { origin },
    data: publicData,
  });
  expect(invalid.status()).toBe(400);
  await page.getByRole('button', { name: 'Encerrar sessão', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Encerrar sessão', exact: true })
    .click();
  await expect(page.getByText('Sessão encerrada', { exact: true })).toBeVisible();
  const closed = await request.post(`/api/demo/${token}`, {
    headers: { origin },
    data: publicData,
  });
  expect(closed.status()).toBe(410);
  await participant.goto(`/demo/${token}`);
  await expect(
    participant.getByRole('heading', { name: 'Esta demonstração não está disponível.' }),
  ).toBeVisible();
  const expiredToken = randomBytes(32).toString('base64url');
  await db()
    .insert(demoSessions)
    .values({
      workspaceId,
      name: 'Expirada',
      token: expiredToken,
      expiresAt: new Date(Date.now() - 10000),
    });
  const expired = await request.post(`/api/demo/${expiredToken}`, {
    headers: { origin },
    data: publicData,
  });
  expect(expired.status()).toBe(410);
  await participant.close();
  // Explicitly insert realistic test fixtures in Neon; no UI-level mock data.
  const names = [
    'Lucas Martins',
    'Mariana Costa',
    'Pedro Almeida',
    'Beatriz Santos',
    'Rafael Lima',
    'Camila Rocha',
    'Gabriel Souza',
    'Juliana Ferreira',
    'Thiago Pereira',
  ];
  for (let i = 0; i < 29; i++) {
    const data = {
      name: names[i % names.length],
      email: `demo.${i}@example.com`,
      company: ['Estúdio Aurora', 'Nexo Consultoria', 'Casa Verde'][i % 3],
      segment: 'Serviços',
      interest: ['Website', 'Gestão de tráfego', 'Consultoria de vendas'][i % 3],
      urgency: ['low', 'medium', 'high'][i % 3],
      budgetRange: i % 3 ? 'under_2k' : 'unknown',
      notes:
        i % 4 === 0 ? 'teste' : 'Precisa organizar os contatos recebidos pelo site da empresa.',
    };
    const s = scoreLead(data);
    await db()
      .insert(leads)
      .values({
        ...data,
        workspaceId,
        source: ['Site', 'Instagram', 'Indicação', 'LinkedIn', 'Evento'][i % 5],
        stage: ['new', 'qualified', 'negotiation', 'won', 'lost'][i % 5],
        score: s.score,
        temperature: s.temperature,
        scoreReason: s.reason,
        scoringMethod: 'rules-v2',
        isDemo: true,
        createdAt: new Date(Date.now() - (i % 28) * 86400000),
      });
  }
  for (const width of [1440, 1280, 1156, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: 'Visão Geral', exact: true })).toBeVisible();
    await page.screenshot({
      path: `artifacts/dashboard-${width}.png`,
      fullPage: true,
      caret: 'initial',
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    if (overflow)
      console.log(
        await page.evaluate(() =>
          Array.from(document.querySelectorAll('body *'))
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return (
                r.right > window.innerWidth + 1 &&
                getComputedStyle(e).position !== 'fixed' &&
                e.tagName !== 'TD' &&
                e.tagName !== 'TH'
              );
            })
            .map((e) => ({
              tag: e.tagName,
              cls: String(e.className),
              right: e.getBoundingClientRect().right,
              overflow: getComputedStyle(e).overflowX,
            }))
            .slice(0, 30),
        ),
      );
    expect(overflow, `overflow em ${width}`).toBe(false);
    if (width === 1440) {
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          description: v.description,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'Meus Leads', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Meus Leads', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['leads', 'pipeline', 'scoring', 'intelligence', 'settings']) {
    await page.goto(`/app/${route}`);
    await expect(page.locator('main h1')).toBeVisible();
    await page.screenshot({
      path: `artifacts/${route}-desktop.png`,
      fullPage: true,
      caret: 'initial',
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `artifacts/${route}-mobile.png`,
      fullPage: true,
      caret: 'initial',
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `overflow em ${route} mobile`,
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.goto(`/app/leads/${testLead}`);
  await page.getByRole('button', { name: 'Excluir lead', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir lead', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/leads$/);
  expect((await api.get(`/api/leads/${testLead}`)).status()).toBe(404);
  const erase = await api.delete('/api/live', {
    headers: { origin },
    data: { id: liveId, confirm: true },
  });
  expect(erase.status()).toBe(200);
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL(/\/login/);
  expect((await api.get('/api/leads')).status()).toBe(401);
  expect(browserErrors).toEqual([]);
});
