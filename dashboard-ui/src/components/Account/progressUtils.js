const PHASE1_SCENARIOS = {
    IO1: ['DryRunEval.IO1', 'phase1-adept-train-IO1'],
    MJ1: ['DryRunEval.MJ1', 'phase1-adept-train-MJ1'],
    MJ2: ['DryRunEval-MJ2-eval', 'phase1-adept-eval-MJ2'],
    MJ4: ['DryRunEval-MJ4-eval', 'phase1-adept-eval-MJ4'],
    MJ5: ['DryRunEval-MJ5-eval', 'phase1-adept-eval-MJ5'],
    QOL1: ['qol-dre-1-eval'],
    QOL2: ['qol-dre-2-eval', 'qol-ph1-eval-2'],
    QOL3: ['qol-dre-3-eval', 'qol-ph1-eval-3'],
    QOL4: ['qol-ph1-eval-4'],
    VOL1: ['vol-dre-1-eval'],
    VOL2: ['vol-dre-2-eval', 'vol-ph1-eval-2'],
    VOL3: ['vol-dre-3-eval', 'vol-ph1-eval-3'],
    VOL4: ['vol-ph1-eval-4']
};

const PHASE2_SCENARIOS = ['AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3']
    .reduce((acc, key) => ({ ...acc, [key]: [`June2025-${key}-eval`] }), {});

export const SCENARIO_HEADERS = [
    'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4',
    ...Object.keys(PHASE1_SCENARIOS),
    ...Object.keys(PHASE2_SCENARIOS)
];

export const setScenarioCompletion = (obj, completedScenarios) => {
    const allScenarios = { ...PHASE1_SCENARIOS, ...PHASE2_SCENARIOS };
    
    Object.keys(allScenarios).forEach(key => {
        const scenarios = allScenarios[key];
        obj[key] = scenarios.some(s => completedScenarios.includes(s)) ? 'y' : null;
    });
};