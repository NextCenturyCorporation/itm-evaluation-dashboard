export const getEnvMappingToText = (sv) => {
    return {
        "AD-1": "Shooter/Victim (Urban)",
        "AD-2": "IED (Jungle)",
        "AD-3": "Fistfight (Desert)",
        "ST-1": sv == 4 ? "QOL-1 and VOL-1" : "QOL-2 and VOL-2",
        "ST-2": sv == 4 ? "QOL-2 and VOL-2" : "QOL-3 and VOL-3",
        "ST-3": sv == 4 ? "QOL-3 and VOL-3" : "QOL-4 and VOL-4",
    }
}

export const getDelEnvMapping = (sv) => {
    return {
        "AD-1": ["DryRunEval-MJ2-eval", "DryRunEval-IO2-eval"],
        "AD-2": ["DryRunEval-MJ4-eval", "DryRunEval-IO4-eval"],
        "AD-3": ["DryRunEval-MJ5-eval", "DryRunEval-IO5-eval"],
        "ST-1": sv == 4 ? ["qol-dre-1-eval", "vol-dre-1-eval"] : ["qol-ph1-eval-2", "vol-ph1-eval-2"],
        "ST-2": sv == 4 ? ["qol-dre-2-eval", "vol-dre-2-eval"] : ["qol-ph1-eval-3", "vol-ph1-eval-3"],
        "ST-3": sv == 4 ? ["qol-dre-3-eval", "vol-dre-3-eval"] : ["qol-ph1-eval-4", "vol-ph1-eval-4"],
    }
}

export const admOrderMapping = {
    1: [{ "TA2": "Kitware", "TA1": "Adept", "Attribute": "MJ" },
    { "TA2": "Parallax", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Parallax", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Kitware", "TA1": "ST", "Attribute": "VOL" },],
    2: [{ "TA2": "Kitware", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Parallax", "TA1": "ST", "Attribute": "VOL" },
    { "TA2": "Parallax", "TA1": "Adept", "Attribute": "MJ" }],
    3: [{ "TA2": "Parallax", "TA1": "Adept", "Attribute": "MJ" },
    { "TA2": "Parallax", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Kitware", "TA1": "ST", "Attribute": "VOL" }],
    4: [{ "TA2": "Parallax", "TA1": "ST", "Attribute": "VOL" },
    { "TA2": "Kitware", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Parallax", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "MJ" }]
}

// DKTODO - update baselines kitware (need to add keys for new st, ternary for adept)
export const getKitwareBaselineMapping = (sv) => {
    return {
        "DryRunEval-IO2-eval": "ADEPT-DryRun-Ingroup Bias-0.5",
        "DryRunEval-IO4-eval": "ADEPT-DryRun-Ingroup Bias-0.6",
        "DryRunEval-IO5-eval": "ADEPT-DryRun-Ingroup Bias-0.6",
        "DryRunEval-MJ2-eval": "ADEPT-DryRun-Moral judgement-0.5",
        "DryRunEval-MJ4-eval": "ADEPT-DryRun-Moral judgement-0.5",
        "DryRunEval-MJ5-eval": "ADEPT-DryRun-Moral judgement-0.5",
        "qol-dre-1-eval": "qol-human-1774519-SplitEvenBinary",
        "qol-dre-2-eval": "qol-human-1774519-SplitEvenBinary",
        "qol-dre-3-eval": "qol-human-6403274-SplitHighBinary",
        "vol-dre-1-eval": "vol-human-7040555-SplitEvenBinary",
        "vol-dre-2-eval": "vol-human-7040555-SplitEvenBinary",
        "vol-dre-3-eval": "vol-human-6403274-SplitEvenBinary"
    }
};


// DKTODO - update baselines parallax (need to add keys for new st, ternary for adept)
export const getTadBaselineMapping = (sv) => {
    return {
        "DryRunEval-IO2-eval": "ADEPT-DryRun-Ingroup Bias-0.4",
        "DryRunEval-IO4-eval": "ADEPT-DryRun-Ingroup Bias-0.4",
        "DryRunEval-IO5-eval": "ADEPT-DryRun-Ingroup Bias-0.4",
        "DryRunEval-MJ2-eval": "ADEPT-DryRun-Moral judgement-0.2",
        "DryRunEval-MJ4-eval": "ADEPT-DryRun-Moral judgement-0.3",
        "DryRunEval-MJ5-eval": "ADEPT-DryRun-Moral judgement-0.3",
        "qol-dre-1-eval": "qol-human-3447902-SplitHighMulti",
        "qol-dre-2-eval": "qol-human-8022671-SplitLowMulti",
        "qol-dre-3-eval": "qol-human-6349649-SplitHighMulti",
        "vol-dre-1-eval": "vol-human-3043871-SplitLowMulti",
        "vol-dre-2-eval": "vol-human-3043871-SplitLowMulti",
        "vol-dre-3-eval": "vol-human-3043871-SplitLowMulti"
    }
};