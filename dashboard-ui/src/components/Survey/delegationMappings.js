export const getEnvMappingToText = (sv) => {
    return {
        "AD-1": "Shooter/Victim (Urban)",
        "AD-2": "IED (Jungle)",
        "AD-3": "Fistfight (Desert)",
        "ST-1": sv === 4 ? "QOL-1 and VOL-1" : "QOL-2 and VOL-2",
        "ST-2": sv === 4 ? "QOL-2 and VOL-2" : "QOL-3 and VOL-3",
        "ST-3": sv === 4 ? "QOL-3 and VOL-3" : "QOL-4 and VOL-4",
    }
}

export const getDelEnvMapping = (evalNum) => {
    return {
        "AD-1": ["DryRunEval-MJ2-eval", "DryRunEval-IO2-eval"],
        "AD-2": ["DryRunEval-MJ4-eval", "DryRunEval-IO4-eval"],
        "AD-3": ["DryRunEval-MJ5-eval", "DryRunEval-IO5-eval"],
        "ST-1": evalNum === 4 ? ["qol-dre-1-eval", "vol-dre-1-eval"] : ["qol-ph1-eval-2", "vol-ph1-eval-2"],
        "ST-2": evalNum === 4 ? ["qol-dre-2-eval", "vol-dre-2-eval"] : ["qol-ph1-eval-3", "vol-ph1-eval-3"],
        "ST-3": evalNum === 4 ? ["qol-dre-3-eval", "vol-dre-3-eval"] : ["qol-ph1-eval-4", "vol-ph1-eval-4"],
        "PH2-1": evalNum === 8 ? ["June2025-AF1-eval", "June2025-MF1-eval", "June2025-SS1-eval", "June2025-PS1-eval", "June2025-AF-MF1-eval"] : ["July2025-AF1-eval", "July2025-MF1-eval", "July2025-SS1-eval", "July2025-PS1-eval", "July2025-AF-MF1-eval"],
        "PH2-2": evalNum === 8 ? ["June2025-AF2-eval", "June2025-MF2-eval", "June2025-SS2-eval", "June2025-PS2-eval", "June2025-AF-MF2-eval"] : ["July2025-AF2-eval", "July2025-MF2-eval", "July2025-SS2-eval", "July2025-PS2-eval", "July2025-AF-MF2-eval"],
        "PH2-3": evalNum === 8 ? ["June2025-AF3-eval", "June2025-MF3-eval", "June2025-SS3-eval", "June2025-PS3-eval", "June2025-AF-MF3-eval"] : ["July2025-AF3-eval", "July2025-MF3-eval", "July2025-SS3-eval", "July2025-PS3-eval", "July2025-AF-MF3-eval"],
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
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "MJ" }],
    5: [{ "TA2": "Kitware", "TA1": "Adept", "Attribute": "SS" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "PS" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "AF" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "MF" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "AF-MF" }]
}

export const getKitwareBaselineMapping = (sv) => {
    return {
        "DryRunEval-IO2-eval": sv === 4 ? "ADEPT-DryRun-Ingroup Bias-0.5" : "ADEPT-DryRun-Ingroup Bias-0.6",
        "DryRunEval-IO4-eval": sv === 4 ? "ADEPT-DryRun-Ingroup Bias-0.6" : "ADEPT-DryRun-Ingroup Bias-0.7",
        "DryRunEval-IO5-eval": sv === 4 ? "ADEPT-DryRun-Ingroup Bias-0.6" : "ADEPT-DryRun-Ingroup Bias-0.8",
        "DryRunEval-MJ2-eval": sv === 4 ? "ADEPT-DryRun-Moral judgement-0.5" : "ADEPT-DryRun-Moral judgement-0.8",
        "DryRunEval-MJ4-eval": sv === 4 ? "ADEPT-DryRun-Moral judgement-0.5" : "ADEPT-DryRun-Moral judgement-0.5",
        "DryRunEval-MJ5-eval": sv === 4 ? "ADEPT-DryRun-Moral judgement-0.5" : "ADEPT-DryRun-Moral judgement-0.3",
        "qol-dre-1-eval": "qol-human-1774519-SplitEvenBinary",
        "qol-dre-2-eval": "qol-human-1774519-SplitEvenBinary",
        "qol-dre-3-eval": "qol-human-6403274-SplitHighBinary",
        "vol-dre-1-eval": "vol-human-7040555-SplitEvenBinary",
        "vol-dre-2-eval": "vol-human-7040555-SplitEvenBinary",
        "vol-dre-3-eval": "vol-human-6403274-SplitEvenBinary",
        "qol-ph1-eval-2": "qol-human-6403274-SplitHighBinary-ph1",
        "qol-ph1-eval-3": "qol-human-6403274-SplitHighBinary-ph1",
        "qol-ph1-eval-4": "qol-human-7040555-SplitHighMulti-ph1",
        "vol-ph1-eval-2": "vol-human-8022671-SplitHighMulti-ph1",
        "vol-ph1-eval-3": "vol-human-6403274-SplitEvenBinary-ph1",
        "vol-ph1-eval-4": "vol-human-5032922-SplitLowMulti-ph1"

    }
};

export const getTadBaselineMapping = (sv) => {
    return {
        "DryRunEval-IO2-eval": sv === 4 ? "ADEPT-DryRun-Ingroup Bias-0.4" : "ADEPT-DryRun-Ingroup Bias-0.3",
        "DryRunEval-IO4-eval": sv === 4 ? "ADEPT-DryRun-Ingroup Bias-0.4" : "ADEPT-DryRun-Ingroup Bias-0.3",
        "DryRunEval-IO5-eval": sv === 4 ? "ADEPT-DryRun-Ingroup Bias-0.4" : "ADEPT-DryRun-Ingroup Bias-0.3",
        "DryRunEval-MJ2-eval": sv === 4 ? "ADEPT-DryRun-Moral judgement-0.2" : "ADEPT-DryRun-Moral judgement-0.2",
        "DryRunEval-MJ4-eval": sv === 4 ? "ADEPT-DryRun-Moral judgement-0.3" : "ADEPT-DryRun-Moral judgement-0.2",
        "DryRunEval-MJ5-eval": sv === 4 ? "ADEPT-DryRun-Moral judgement-0.3" : "ADEPT-DryRun-Moral judgement-0.2",
        "qol-dre-1-eval": "qol-human-3447902-SplitHighMulti",
        "qol-dre-2-eval": "qol-human-8022671-SplitLowMulti",
        "qol-dre-3-eval": "qol-human-6349649-SplitHighMulti",
        "vol-dre-1-eval": "vol-human-3043871-SplitLowMulti",
        "vol-dre-2-eval": "vol-human-3043871-SplitLowMulti",
        "vol-dre-3-eval": "vol-human-3043871-SplitLowMulti",
        "qol-ph1-eval-2": "qol-human-0000001-SplitEvenMulti-ph1",
        "qol-ph1-eval-3": "qol-human-0000001-SplitEvenMulti-ph1",
        "qol-ph1-eval-4": "qol-human-3043871-SplitHighBinary-ph1",
        "vol-ph1-eval-2": "vol-human-5032922-SplitLowMulti-ph1",
        "vol-ph1-eval-3": "vol-human-5032922-SplitLowMulti-ph1",
        "vol-ph1-eval-4": "vol-human-8022671-SplitHighMulti-ph1"
    }
};