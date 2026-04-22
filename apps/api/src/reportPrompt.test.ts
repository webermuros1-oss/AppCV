import { describe, expect, it } from 'vitest';
import { parseReport } from './reportPrompt.js';

describe('parseReport', () => {
  it('parsea JSON limpio correctamente', () => {
    const raw = JSON.stringify({
      clarity: 80,
      confidence: 75,
      fillerWords: 4,
      suggestions: ['uno', 'dos', 'tres'],
    });
    const report = parseReport(raw);
    expect(report).toEqual({
      clarity: 80,
      confidence: 75,
      fillerWords: 4,
      suggestions: ['uno', 'dos', 'tres'],
    });
  });

  it('tolera fences de markdown con etiqueta json', () => {
    const raw = '```json\n{"clarity":50,"confidence":60,"fillerWords":2,"suggestions":["a","b","c"]}\n```';
    const report = parseReport(raw);
    expect(report.clarity).toBe(50);
    expect(report.confidence).toBe(60);
    expect(report.fillerWords).toBe(2);
    expect(report.suggestions).toEqual(['a', 'b', 'c']);
  });

  it('tolera fences de markdown sin etiqueta', () => {
    const raw = '```\n{"clarity":30,"confidence":40,"fillerWords":1,"suggestions":["x"]}\n```';
    const report = parseReport(raw);
    expect(report.clarity).toBe(30);
    expect(report.confidence).toBe(40);
  });

  it('tolera prosa antes y despues del JSON', () => {
    const raw = 'Aquí va el reporte que me pediste:\n{"clarity":70,"confidence":65,"fillerWords":3,"suggestions":["uno","dos","tres"]}\nEspero que sirva.';
    const report = parseReport(raw);
    expect(report.clarity).toBe(70);
    expect(report.confidence).toBe(65);
    expect(report.suggestions).toEqual(['uno', 'dos', 'tres']);
  });

  it('capa scores superiores a 100 a 100', () => {
    const raw = JSON.stringify({
      clarity: 150,
      confidence: 999,
      fillerWords: 2,
      suggestions: ['a'],
    });
    const report = parseReport(raw);
    expect(report.clarity).toBe(100);
    expect(report.confidence).toBe(100);
  });

  it('sube scores negativos a 0', () => {
    const raw = JSON.stringify({
      clarity: -10,
      confidence: -1,
      fillerWords: 0,
      suggestions: [],
    });
    const report = parseReport(raw);
    expect(report.clarity).toBe(0);
    expect(report.confidence).toBe(0);
  });

  it('redondea scores decimales', () => {
    const raw = JSON.stringify({
      clarity: 72.7,
      confidence: 40.2,
      fillerWords: 0,
      suggestions: [],
    });
    const report = parseReport(raw);
    expect(report.clarity).toBe(73);
    expect(report.confidence).toBe(40);
  });

  it('trata clarity no numérico como 0', () => {
    const raw = '{"clarity":"alto","confidence":50,"fillerWords":1,"suggestions":[]}';
    const report = parseReport(raw);
    expect(report.clarity).toBe(0);
    expect(report.confidence).toBe(50);
  });

  it('trata fillerWords negativo como 0', () => {
    const raw = JSON.stringify({
      clarity: 50,
      confidence: 50,
      fillerWords: -5,
      suggestions: [],
    });
    const report = parseReport(raw);
    expect(report.fillerWords).toBe(0);
  });

  it('hace floor de fillerWords decimal', () => {
    const raw = JSON.stringify({
      clarity: 50,
      confidence: 50,
      fillerWords: 3.9,
      suggestions: [],
    });
    const report = parseReport(raw);
    expect(report.fillerWords).toBe(3);
  });

  it('trata fillerWords no numérico como 0', () => {
    const raw = '{"clarity":50,"confidence":50,"fillerWords":"muchas","suggestions":[]}';
    const report = parseReport(raw);
    expect(report.fillerWords).toBe(0);
  });

  it('filtra elementos no string del array de suggestions', () => {
    const raw = '{"clarity":50,"confidence":50,"fillerWords":0,"suggestions":["valida",42,null,"otra"]}';
    const report = parseReport(raw);
    expect(report.suggestions).toEqual(['valida', 'otra']);
  });

  it('devuelve suggestions vacío si no es array', () => {
    const raw = '{"clarity":50,"confidence":50,"fillerWords":0,"suggestions":"texto"}';
    const report = parseReport(raw);
    expect(report.suggestions).toEqual([]);
  });

  it('lanza error si no hay JSON recuperable', () => {
    expect(() => parseReport('esto no es JSON en absoluto')).toThrow();
  });

  it('lanza error si el JSON está corrupto sin llaves balanceadas', () => {
    expect(() => parseReport('no braces here at all')).toThrow(/JSON válido/);
  });

  it('lanza error si parsea a no-objeto (array)', () => {
    expect(() => parseReport('[1,2,3]')).toThrow(/no es un objeto/);
  });
});
