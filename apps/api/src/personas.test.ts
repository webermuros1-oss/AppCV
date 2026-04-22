import { describe, expect, it } from 'vitest';
import { buildPersona } from './personas.js';

const JOB_ROLE = 'Ingeniero de software senior';
const INDUSTRY = 'Fintech';

describe('buildPersona', () => {
  it('devuelve name y systemPrompt para toughness 1', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 1 });
    expect(typeof persona.name).toBe('string');
    expect(persona.name.length).toBeGreaterThan(0);
    expect(typeof persona.systemPrompt).toBe('string');
    expect(persona.systemPrompt.length).toBeGreaterThan(0);
  });

  it('devuelve name y systemPrompt para toughness 2', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 2 });
    expect(persona.name).toBeTruthy();
    expect(persona.systemPrompt).toBeTruthy();
  });

  it('devuelve name y systemPrompt para toughness 3', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 3 });
    expect(persona.name).toBeTruthy();
    expect(persona.systemPrompt).toBeTruthy();
  });

  it('devuelve name y systemPrompt para toughness 4', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 4 });
    expect(persona.name).toBeTruthy();
    expect(persona.systemPrompt).toBeTruthy();
  });

  it('devuelve name y systemPrompt para toughness 5', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 5 });
    expect(persona.name).toBeTruthy();
    expect(persona.systemPrompt).toBeTruthy();
  });

  it('incluye literalmente el jobRole en el systemPrompt', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 3 });
    expect(persona.systemPrompt).toContain(JOB_ROLE);
  });

  it('incluye literalmente el industry en el systemPrompt', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 3 });
    expect(persona.systemPrompt).toContain(INDUSTRY);
  });

  it('toughness 1 menciona tono amable o alentador', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 1 });
    const prompt = persona.systemPrompt.toLowerCase();
    expect(prompt.includes('amable') || prompt.includes('alentador')).toBe(true);
  });

  it('toughness 5 menciona presión, repreguntas duras o silencios incómodos', () => {
    const persona = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 5 });
    const prompt = persona.systemPrompt.toLowerCase();
    const mencionaPresion = prompt.includes('presion') || prompt.includes('presión');
    const mencionaRepregunta = prompt.includes('repregunta');
    const mencionaSilencio = prompt.includes('silencio') || prompt.includes('incómod');
    expect(mencionaPresion || mencionaRepregunta || mencionaSilencio).toBe(true);
  });

  it('genera el mismo systemPrompt de forma determinista para los mismos argumentos', () => {
    const a = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 3 });
    const b = buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness: 3 });
    expect(a.systemPrompt).toEqual(b.systemPrompt);
    expect(a.name).toEqual(b.name);
  });

  it('snapshot de los 5 prompts resultantes', () => {
    const prompts = ([1, 2, 3, 4, 5] as const).map((toughness) =>
      buildPersona({ jobRole: JOB_ROLE, industry: INDUSTRY, toughness }),
    );
    expect(prompts).toMatchSnapshot();
  });
});
