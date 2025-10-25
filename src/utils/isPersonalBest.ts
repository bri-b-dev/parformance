export type Session = {
    id?: string;
    drillId: string;
    metrics: Record<string, number | undefined>;
};

export type MetricRule = {
    // If provided, comparator(a,b) should return >0 if a is better than b
    comparator?: (a: number, b: number) => number;
    // If comparator is not provided, use greaterIsBetter (true by default)
    greaterIsBetter?: boolean;
};

export function isPersonalBest(
    newSession: Session,
    previousSessions: Session[],
    metricKey: string,
    metricRule?: MetricRule
): boolean {
    // Get new value
    const newVal = newSession.metrics[metricKey];
    if (newVal === undefined || newVal === null) return false;

    // Filter previous sessions for same drill and with that metric defined
    const prevValues = previousSessions
        .filter(s => s.drillId === newSession.drillId)
        .map(s => s.metrics[metricKey])
        .filter((v): v is number => v !== undefined && v !== null);

    // Not shown on first ever session
    if (prevValues.length === 0) return false;

    if (metricRule?.comparator) {
        // comparator returns >0 when a is better than b
        const bestPrev = prevValues.reduce((best, v) =>
            metricRule!.comparator!(v, best) > 0 ? v : best
        , prevValues[0]);
        // require strict improvement
        return metricRule.comparator(newVal, bestPrev) > 0;
    }

    const greaterIsBetter = metricRule?.greaterIsBetter ?? true;
    const bestPrev = prevValues.reduce((best, v) =>
        greaterIsBetter ? Math.max(best, v) : Math.min(best, v)
    , prevValues[0]);

    return greaterIsBetter ? newVal > bestPrev : newVal < bestPrev;
}