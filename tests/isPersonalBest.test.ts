import { isPersonalBest, Session, MetricRule } from '../src/utils/isPersonalBest';

describe('isPersonalBest', () => {
    const drillId = 'drill-1';
    const metricKey = 'score';

    test('returns false on first ever session', () => {
        const newSession: Session = { drillId, metrics: { score: 10 } };
        const prev: Session[] = [];
        expect(isPersonalBest(newSession, prev, metricKey)).toBe(false);
    });

    test('returns true when strictly greater (default greaterIsBetter)', () => {
        const newSession: Session = { drillId, metrics: { score: 15 } };
        const prev: Session[] = [
            { drillId, metrics: { score: 10 } },
            { drillId, metrics: { score: 14 } }
        ];
        expect(isPersonalBest(newSession, prev, metricKey)).toBe(true);
    });

    test('returns false when equal to previous best', () => {
        const newSession: Session = { drillId, metrics: { score: 14 } };
        const prev: Session[] = [
            { drillId, metrics: { score: 10 } },
            { drillId, metrics: { score: 14 } }
        ];
        expect(isPersonalBest(newSession, prev, metricKey)).toBe(false);
    });

    test('supports lower-is-better metric rule', () => {
        const newSession: Session = { drillId, metrics: { score: 4 } };
        const prev: Session[] = [
            { drillId, metrics: { score: 5 } },
            { drillId, metrics: { score: 6 } }
        ];
        const rule: MetricRule = { greaterIsBetter: false };
        expect(isPersonalBest(newSession, prev, metricKey, rule)).toBe(true);
    });

    test('ignores previous sessions of other drills and missing metrics', () => {
        const newSession: Session = { drillId, metrics: { score: 20 } };
        const prev: Session[] = [
            { drillId: 'other', metrics: { score: 100 } },
            { drillId, metrics: { /* missing score */ } as any },
            { drillId, metrics: { score: 19 } }
        ];
        expect(isPersonalBest(newSession, prev, metricKey)).toBe(true);
    });

    test('supports custom comparator', () => {
        // comparator: larger string length is better (example)
        const metricKey2 = 'len';
        const newSession: Session = { drillId, metrics: { len: 6 } };
        const prev: Session[] = [
            { drillId, metrics: { len: 4 } },
            { drillId, metrics: { len: 5 } }
        ];
        const rule: MetricRule = { comparator: (a, b) => a - b };
        expect(isPersonalBest(newSession, prev, metricKey2, rule)).toBe(true);
    });
});