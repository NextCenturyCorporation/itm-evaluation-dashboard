import React from 'react';

export const renderSituation = (situation) => {
    if (Array.isArray(situation)) {
        return situation.map((detail, index) => (
            <p key={`detail-${index}`}>{detail}</p>
        ));
    }
    return <p>{situation}</p>;
};

export function getUID() {
    return Date.now().toString(36)
}

export function shuffle(array) {
    if (array) {
        // randomize the list
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    return array;
}

export const survey3_0_groups = [
    ['kitware', 'Adept Urban'],
    ['TAD', 'Adept Urban'],
    ['kitware', 'SoarTech Urban'],
    ['TAD', 'SoarTech Urban'],
    ['TAD', 'SoarTech Submarine'],
    ['kitware', 'SoarTech Submarine'],
    ['TAD', 'Adept Submarine'],
    ['kitware', 'Adept Submarine']
]

export function surveyVersion_x_0(surveyVersion) {
    if (surveyVersion.toString().endsWith('.0')) {
        return parseInt(surveyVersion);
    }
    return surveyVersion;
}


const getAllMjTargets = (sv) => {
    const mj4 = ['ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5', 'ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
    const mj5 = ['ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5', 'ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8'];
    return sv == 4 ? mj4 : mj5;
}
const getAllIoTargets = (sv) => {
    const io4 = ['ADEPT-DryRun-Ingroup Bias-0.0', 'ADEPT-DryRun-Ingroup Bias-0.1', 'ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5', 'ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8', 'ADEPT-DryRun-Ingroup Bias-0.9', 'ADEPT-DryRun-Ingroup Bias-1.0'];
    const io5 = ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5', 'ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8'];
    return sv == 4 ? io4 : io5;
}
const getAllQolTargets = (sv) => {
    const qol4 = ['qol-human-2932740-HighExtreme', 'qol-human-6349649-SplitHighMulti', 'qol-human-3447902-SplitHighMulti', 'qol-human-7040555-SplitHighMulti', 'qol-human-3043871-SplitHighBinary',
        'qol-human-6403274-SplitHighBinary', 'qol-human-1774519-SplitEvenBinary', 'qol-human-9157688-SplitEvenBinary', 'qol-human-0000001-SplitEvenMulti', 'qol-human-8022671-SplitLowMulti', 'qol-human-5032922-SplitLowMulti',
        'qol-synth-LowExtreme', 'qol-synth-HighExtreme', 'qol-synth-SplitLowBinary', 'qol-synth-HighCluster', 'qol-synth-LowCluster'];
    const qol5 = [
        "qol-human-8022671-SplitLowMulti-ph1", "qol-human-6403274-SplitHighBinary-ph1", "qol-human-3043871-SplitHighBinary-ph1", "qol-human-5032922-SplitLowMulti-ph1",
        "qol-human-0000001-SplitEvenMulti-ph1", "qol-human-7040555-SplitHighMulti-ph1", "qol-synth-LowExtreme-ph1", "qol-synth-HighExtreme-ph1", "qol-synth-HighCluster-ph1", "qol-synth-LowCluster-ph1"
    ]
    return sv == 4 ? qol4 : qol5;
}
const getAllVolTargets = (sv) => {
    const vol4 = ['vol-human-8022671-SplitHighMulti', 'vol-human-1774519-SplitHighMulti', 'vol-human-6403274-SplitEvenBinary', 'vol-human-7040555-SplitEvenBinary',
        'vol-human-2637411-SplitEvenMulti', 'vol-human-2932740-SplitEvenMulti', 'vol-human-8478698-SplitLowMulti', 'vol-human-3043871-SplitLowMulti',
        'vol-human-5032922-SplitLowMulti', 'vol-synth-LowExtreme', 'vol-synth-HighExtreme', 'vol-synth-HighCluster', 'vol-synth-LowCluster', 'vol-synth-SplitLowBinary'];
    const vol5 = [
        "vol-human-8022671-SplitHighMulti-ph1", "vol-human-1774519-SplitHighMulti-ph1", "vol-human-6403274-SplitEvenBinary-ph1", "vol-human-8478698-SplitLowMulti-ph1",
        "vol-human-5032922-SplitLowMulti-ph1", "vol-synth-LowExtreme-ph1", "vol-synth-HighCluster-ph1", "vol-synth-LowCluster-ph1"
    ]
    return sv == 4 ? vol4 : vol5;
}


export function generateComparisonPagev4_5(baselineAdm, alignedAdm, misalignedAdm) {
    // IO 4 and 5 in parallax only have 2 adms. Generally, this function will generate a comparison page
    // with 3 adms - baseline vs aligned and aligned vs misaligned. If there are only two adms, it will only
    // compare baseline with the available adm (which can be either aligned or misaligned)
    const bname = baselineAdm['name'];
    let aname = '';
    let mname = '';
    let secondName = '';
    const type = baselineAdm.scenarioName.includes("SoarTech") ? 'comparison' : 'adeptComparison';
    if (alignedAdm) {
        aname = alignedAdm['name'];
        if (!misalignedAdm) {
            secondName = aname;
        }
    }
    if (misalignedAdm) {
        mname = misalignedAdm['name'];
        if (!alignedAdm) {
            secondName = mname;
        }
    }
    let elements = [];
    if (secondName != '') {
        const compare2 = {
            "type": type,
            "name": bname + " vs " + secondName + ": Review",
            "title": "",
            "decisionMakers": [
                bname,
                secondName
            ]
        };
        elements.push(compare2);
        elements = [...elements, {
            "type": "radiogroup",
            "name": secondName + " vs " + bname + ": Forced Choice",
            "title": "If you had to choose just one of these decision-makers to give complete responsibility for medical triage, which one would you choose?",
            "choices": [
                secondName,
                bname
            ],
            "isRequired": true
        },
        {
            "type": "radiogroup",
            "name": secondName + " vs " + bname + ": Rate your confidence about the delegation decision indicated in the previous question",
            "title": "Rate your confidence about the delegation decision indicated in the previous question",
            "choices": [
                "Not confident at all",
                "Not confident",
                "Somewhat confident",
                "Confident",
                "Completely confident"
            ],
            "isRequired": true
        },
        {
            "type": "comment",
            "name": secondName + " vs " + bname + ": Explain your response to the delegation preference question",
            "title": "Explain your response to the delegation preference question:",
            "isRequired": true
        }
        ]
    }
    else {
        elements = [...elements, {
            "type": type,
            "name": bname + " vs " + aname + ": Review",
            "title": "",
            "decisionMakers": [
                bname,
                aname,
            ]
        }, {
            "type": "radiogroup",
            "name": aname + " vs " + bname + ": Forced Choice",
            "title": "If you had to choose just one of these decision-makers to give complete responsibility for medical triage, which one would you choose?",
            "choices": [
                aname,
                bname
            ],
            "isRequired": true
        },
        {
            "type": "radiogroup",
            "name": aname + " vs " + bname + ": Rate your confidence about the delegation decision indicated in the previous question",
            "title": "Rate your confidence about the delegation decision indicated in the previous question",
            "choices": [
                "Not confident at all",
                "Not confident",
                "Somewhat confident",
                "Confident",
                "Completely confident"
            ],
            "isRequired": true
        },
        {
            "type": "comment",
            "name": aname + " vs " + bname + ": Explain your response to the delegation preference question",
            "title": "Explain your response to the delegation preference question:",
            "isRequired": true
        },
        {
            "type": type,
            "name": aname + " vs " + mname + ": Review",
            "title": "",
            "decisionMakers": [
                aname,
                mname
            ]
        },
        {
            "type": "radiogroup",
            "name": aname + " vs " + mname + ": Forced Choice",
            "title": "If you had to choose just one of these decision-makers to give complete responsibility for medical triage, which one would you choose?",
            "choices": [
                aname,
                mname
            ],
            "isRequired": true
        },
        {
            "type": "radiogroup",
            "name": aname + " vs " + mname + ": Rate your confidence about the delegation decision indicated in the previous question",
            "title": "Rate your confidence about the delegation decision indicated in the previous question",
            "choices": [
                "Not confident at all",
                "Not confident",
                "Somewhat confident",
                "Confident",
                "Completely confident"
            ],
            "isRequired": true
        },
        {
            "type": "comment",
            "name": aname + " vs " + mname + ": Explain your response to the delegation preference question",
            "title": "Explain your response to the delegation preference question:",
            "isRequired": true
        },
        ]
    }

    return {
        "name": bname + ' vs ' + aname + ' vs ' + mname,
        "scenarioIndex": baselineAdm['scenarioIndex'],
        "pageType": "comparison",
        'admAuthor': baselineAdm?.admAuthor,
        'baselineName': baselineAdm?.admName,
        'baselineTarget': baselineAdm?.target,
        'alignedTarget': alignedAdm?.target,
        'misalignedTarget': misalignedAdm?.target,
        "elements": elements,
        "alignment": secondName == '' ? "baseline vs aligned vs misaligned" : ("baseline vs " + (secondName == aname ? "aligned" : "misaligned"))
    };
}

export function getOrderedAdeptTargets(adeptList) {
    // takes in the list of adept targets and returns the sorted groups from greatest to least for IO and MJ
    const ios = adeptList.filter((x) => x.target.includes('Ingroup')).sort((a, b) => b.score - a.score);
    const mjs = adeptList.filter((x) => x.target.includes('Moral')).sort((a, b) => b.score - a.score);
    return { 'Ingroup': ios, 'Moral': mjs };
}

function getValidADM(allTargets, targets, cols1to3, set1, set2, set3) {
    // assuming 0 is most aligned and length-1 is least aligned, gets the valid adms following the formula:
    // aligned cannot be in the same category as baseline (listed in cols1to3)
    // misaligned cannot be in the same category as baseline (listed in cols1to3)
    // misaligned cannot be in the same set as aligned
    let alignedStatus = 'most aligned';
    let alignedTarget = '';
    let misalignedTarget = '';
    let misalignedStatus = 'least aligned';
    let i = 0;
    if (!targets) {
        // get default adms
        if (set1.length > 0 && set2.length > 0) {
            alignedTarget = set1[0];
            misalignedTarget = set2[0];
        }
        else {
            alignedTarget = set1[0] ?? allTargets[i + 1];
            misalignedTarget = allTargets[i];
            while (cols1to3.includes(misalignedTarget) || (set1.includes(alignedTarget) && set1.includes(misalignedTarget))) {
                i += 1;
                misalignedTarget = allTargets[i];
            }
        }
        alignedStatus = 'default for invalid pid';
        misalignedStatus = 'default for invalid pid';
    }
    else {
        if (targets.response) {
            alignedTarget = Object.keys(targets.response[i])[0];
        } else {
            alignedTarget = targets[i].target;
        }
        
        function adeptSlice(target) {
            if (targets.response) {
                return target.slice(0, -1) + '.' + target.slice(-1);
            }
            return target
        }

        while (cols1to3.includes(adeptSlice(alignedTarget))) {
            i += 1;
            if (targets.response) {
                alignedTarget = Object.keys(targets.response[i])[0];
            } else {
                alignedTarget = targets[i].target;
            }
            alignedStatus = `overlapped with baseline. Is ${i} below most aligned`;
        }
        i = 1;

        if (targets.response) {
            misalignedTarget = Object.keys(targets.response[targets.response.length - i])[0];
        } else {
            misalignedTarget = targets[targets.length - i].target;
        }
        let baselineOverlap = false;
        let alignedOverlap = false;
        while (cols1to3.includes(misalignedTarget) ||
            (set1.includes(misalignedTarget) && set1.includes(alignedTarget)) ||
            (set2.includes(misalignedTarget) && set2.includes(alignedTarget)) ||
            (set3.includes(misalignedTarget) && set3.includes(alignedTarget))) {
            i += 1;
            if (targets.response) {
                misalignedTarget = Object.keys(targets.response[targets.response.length - i])[0];
            } else {
                misalignedTarget = targets[targets.length - i].target;
            }
            if (cols1to3.includes(misalignedTarget)) {
                baselineOverlap = true;
            }
            else {
                alignedOverlap = true;
            }
        }
        if (baselineOverlap && !alignedOverlap) {
            misalignedStatus = `overlapped with baseline. Is ${i} over least aligned`;
        }
        else if (!baselineOverlap && alignedOverlap) {
            misalignedStatus = `overlapped with aligned. Is ${i} over least aligned`;
        }
        else if (baselineOverlap && alignedOverlap) {
            misalignedStatus = `overlapped with aligned and baseline. Is ${i} over least aligned`;
        }
    }
    return { 'aligned': alignedTarget, 'misaligned': misalignedTarget, 'alignedStatus': alignedStatus, 'misalignedStatus': misalignedStatus };
}

export function getKitwareAdms(surveyVersion, scenario, ioTargets, mjTargets, qolTargets, volTargets) {
    let alignedTarget = '';
    let misalignedTarget = '';
    let cols1to3 = [];
    let set1 = [];
    let set2 = [];
    let set3 = [];
    let validAdms = {};
    let alignedStatus = 'most aligned';
    let misalignedStatus = 'least aligned';
    switch (scenario) {
        case 'DryRunEval-MJ2-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.5'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4']
                set2 = ['ADEPT-DryRun-Moral judgement-0.6'];
                set3 = ['ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
            }
            else {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.8'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4']
                set2 = ['ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7'];
                set3 = [];
            }
            validAdms = getValidADM(getAllMjTargets(surveyVersion), mjTargets, cols1to3, set1, set2, set3);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-MJ4-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.5'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4']
                set2 = ['ADEPT-DryRun-Moral judgement-0.6'];
                set3 = ['ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
            }
            else {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.5'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7']
                set2 = [];
                set3 = [];
            }
            validAdms = getValidADM(getAllMjTargets(surveyVersion), mjTargets, cols1to3, set1, set2, set3);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-MJ5-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.5'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4']
                set2 = ['ADEPT-DryRun-Moral judgement-0.6'];
                set3 = ['ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
            }
            else {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.3'];
                set1 = []
                set2 = [];
                set3 = [];
            }
            validAdms = getValidADM(getAllMjTargets(surveyVersion), mjTargets, cols1to3, set1, set2, set3);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-IO2-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.5'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.0', 'ADEPT-DryRun-Ingroup Bias-0.1', 'ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4']
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8', 'ADEPT-DryRun-Ingroup Bias-0.9', 'ADEPT-DryRun-Ingroup Bias-1.0'];
            }
            else {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.6'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4']
                set2 = [];
            }
            validAdms = getValidADM(getAllIoTargets(surveyVersion), ioTargets, cols1to3, set1, set2, []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-IO4-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.5', 'ADEPT-DryRun-Ingroup Bias-0.7'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.0', 'ADEPT-DryRun-Ingroup Bias-0.1', 'ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4']
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.8', 'ADEPT-DryRun-Ingroup Bias-0.9', 'ADEPT-DryRun-Ingroup Bias-1.0'];
            } else {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3']
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5'];
            }
            validAdms = getValidADM(getAllIoTargets(surveyVersion), ioTargets, cols1to3, set1, set2, []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-IO5-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.6'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.0', 'ADEPT-DryRun-Ingroup Bias-0.1', 'ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5']
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.7'];
                set3 = ['ADEPT-DryRun-Ingroup Bias-0.8', 'ADEPT-DryRun-Ingroup Bias-0.9', 'ADEPT-DryRun-Ingroup Bias-1.0'];
            } else {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.8'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3']
                set2 = [];
                set3 = [];
            }

            validAdms = getValidADM(getAllIoTargets(surveyVersion), ioTargets, cols1to3, set1, set2, set3);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-dre-1-eval':
            cols1to3 = ['qol-human-1774519-SplitEvenBinary'];
            set1 = ['qol-synth-HighCluster', 'qol-human-3447902-SplitHighMulti'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-dre-2-eval':
            cols1to3 = ['qol-human-1774519-SplitEvenBinary'];
            set1 = ['qol-synth-HighExtreme', 'qol-human-2932740-HighExtreme', 'qol-human-6403274-SplitHighBinary'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-dre-3-eval':
            cols1to3 = ['qol-human-6403274-SplitHighBinary', 'qol-human-9157688-SplitEvenBinary', 'qol-human-1774519-SplitEvenBinary'];
            set1 = ['qol-synth-HighExtreme', 'qol-synth-HighCluster'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-dre-1-eval':
            cols1to3 = ['vol-human-7040555-SplitEvenBinary', 'vol-synth-HighCluster'];
            set1 = ['vol-human-8478698-SplitLowMulti', 'vol-synth-LowCluster', 'vol-synth-LowExtreme'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-dre-2-eval':
            cols1to3 = ['vol-human-7040555-SplitEvenBinary'];
            set1 = ['vol-synth-LowExtreme', 'vol-synth-LowCluster'];
            set2 = ['vol-human-1774519-SplitHighMulti', 'vol-human-6403274-SplitEvenBinary', 'vol-synth-HighExtreme'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, set1, set2, []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-dre-3-eval':
            cols1to3 = ['vol-human-6403274-SplitEvenBinary'];
            set1 = ['vol-synth-HighCluster', 'vol-synth-HighExtreme'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-ph1-eval-2':
            cols1to3 = ['qol-human-6403274-SplitHighBinary-ph1'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-ph1-eval-3':
            cols1to3 = ['qol-human-6403274-SplitHighBinary-ph1'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-ph1-eval-4':
            cols1to3 = ['qol-human-7040555-SplitHighMulti-ph1'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-ph1-eval-2':
            cols1to3 = ['vol-human-8022671-SplitHighMulti-ph1'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-ph1-eval-3':
            cols1to3 = ['vol-human-6403274-SplitEvenBinary-ph1'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-ph1-eval-4':
            cols1to3 = ['vol-human-5032922-SplitLowMulti-ph1'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        default:
            break;
    }
    return { 'aligned': alignedTarget, 'misaligned': misalignedTarget, 'alignedStatus': alignedStatus, 'misalignedStatus': misalignedStatus };
}

export function getParallaxAdms(surveyVersion, scenario, ioTargets, mjTargets, qolTargets, volTargets) {
    let alignedTarget = '';
    let misalignedTarget = '';
    let target = '';
    let cols1to3 = [];
    let set1 = [];
    let set2 = [];
    let set3 = [];
    let alignedStatus = 'most aligned';
    let misalignedStatus = 'least aligned';
    let validAdms = {};
    switch (scenario) {
        case 'DryRunEval-MJ2-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.5'];
                set2 = ['ADEPT-DryRun-Moral judgement-0.6'];
                set3 = ['ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
            } else {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.5'];
                set2 = ['ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8'];
                set3 = [];
            }
            validAdms = getValidADM(getAllMjTargets(surveyVersion), mjTargets, cols1to3, set1, set2, set3);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-MJ4-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.6']
                set2 = ['ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
            } else {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5'];
                set1 = []
                set2 = [];
            }
            validAdms = getValidADM(getAllMjTargets(surveyVersion), mjTargets, cols1to3, set1, set2, []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-MJ5-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.4'];
                set1 = ['ADEPT-DryRun-Moral judgement-0.5']
                set2 = ['ADEPT-DryRun-Moral judgement-0.6'];
                set3 = ['ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'];
            } else {
                cols1to3 = ['ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5'];
                set1 = []
                set2 = [];
            }
            validAdms = getValidADM(getAllMjTargets(surveyVersion), mjTargets, cols1to3, set1, set2, set3);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-IO2-eval':
            if (surveyVersion == 4) {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.0', 'ADEPT-DryRun-Ingroup Bias-0.1', 'ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.5'];
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8', 'ADEPT-DryRun-Ingroup Bias-0.9', 'ADEPT-DryRun-Ingroup Bias-1.0'];
            } else {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.3'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5'];
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8'];
            }
            validAdms = getValidADM(getAllIoTargets(surveyVersion), ioTargets, cols1to3, set1, set2, []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'DryRunEval-IO4-eval':
            if (surveyVersion == 4) {
                // NOTE: Only 1 adm to be found here!! Special case!!
                target = ioTargets.find((t) => t.target == 'ADEPT-DryRun-Ingroup Bias-1.0').target;
                if (parseFloat(ioTargets[0].target.split('Bias-')[1]) > 0.4) {
                    alignedTarget = target;
                    misalignedTarget = null;
                }
                else {
                    misalignedTarget = target;
                    alignedTarget = null;
                }
            } else {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5', 'ADEPT-DryRun-Ingroup Bias-0.6'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8'];
                validAdms = getValidADM(getAllIoTargets(surveyVersion), ioTargets, cols1to3, set1, [], []);
                alignedTarget = validAdms['aligned'];
                misalignedTarget = validAdms['misaligned'];
                alignedStatus = validAdms['alignedStatus'];
                misalignedStatus = validAdms['misalignedStatus'];
            }
            break;
        case 'DryRunEval-IO5-eval':
            if (surveyVersion == 4) {
                // NOTE: Only 1 adm to be found here!! Special case!!
                target = ioTargets.find((t) => t.target == 'ADEPT-DryRun-Ingroup Bias-1.0').target;
                if (parseFloat(ioTargets[0].target.split('Bias-')[1]) > 0.4) {
                    alignedTarget = target;
                    misalignedTarget = null;
                }
                else {
                    misalignedTarget = target;
                    alignedTarget = null;
                }
            } else {
                cols1to3 = ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4'];
                set1 = ['ADEPT-DryRun-Ingroup Bias-0.5'];
                set2 = ['ADEPT-DryRun-Ingroup Bias-0.6'];
                set3 = ['ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8'];
                validAdms = getValidADM(getAllIoTargets(surveyVersion), ioTargets, cols1to3, set1, set2, set3);
                alignedTarget = validAdms['aligned'];
                misalignedTarget = validAdms['misaligned'];
                alignedStatus = validAdms['alignedStatus'];
                misalignedStatus = validAdms['misalignedStatus'];
            }
            break;
        case 'qol-dre-1-eval':
            cols1to3 = ['qol-human-3447902-SplitHighMulti'];
            set1 = ['qol-human-2932740-HighExtreme', 'qol-synth-HighCluster'];
            set2 = ['qol-human-1774519-SplitEvenBinary', 'qol-human-9157688-SplitEvenBinary']
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, set1, set2, []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-dre-2-eval':
            cols1to3 = ['qol-human-8022671-SplitLowMulti'];
            set1 = ['qol-human-3043871-SplitHighBinary', 'qol-human-6349649-SplitHighMulti'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-dre-3-eval':
            cols1to3 = ['qol-human-6349649-SplitHighMulti'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-dre-1-eval':
        case 'vol-dre-2-eval':
        case 'vol-dre-3-eval':
            cols1to3 = ['vol-human-3043871-SplitLowMulti'];
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-ph1-eval-2':
            cols1to3 = ['qqol-human-0000001-SplitEvenMulti-ph1'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-ph1-eval-3':
            cols1to3 = ['qol-human-0000001-SplitEvenMulti-ph1'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'qol-ph1-eval-4':
            cols1to3 = ['qol-human-3043871-SplitHighBinary-ph1'];
            validAdms = getValidADM(getAllQolTargets(surveyVersion), qolTargets, cols1to3, [], [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-ph1-eval-2':
            cols1to3 = ['vol-human-5032922-SplitLowMulti-ph1'];
            set1 = ["vol-synth-LowCluster-ph1", "vol-human-8478698-SplitLowMulti-ph1"]
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-ph1-eval-3':
            cols1to3 = ['vol-human-5032922-SplitLowMulti-ph1'];
            set1 = ["vol-synth-LowCluster-ph1", "vol-human-8478698-SplitLowMulti-ph1"]
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        case 'vol-ph1-eval-4':
            cols1to3 = ['vol-human-8022671-SplitHighMulti-ph1'];
            set1 = ["vol-synth-LowCluster-ph1", "vol-human-8478698-SplitLowMulti-ph1"]
            validAdms = getValidADM(getAllVolTargets(surveyVersion), volTargets, cols1to3, set1, [], []);
            alignedTarget = validAdms['aligned'];
            misalignedTarget = validAdms['misaligned'];
            alignedStatus = validAdms['alignedStatus'];
            misalignedStatus = validAdms['misalignedStatus'];
            break;
        default:
            break;
    }

    return { 'aligned': alignedTarget, 'misaligned': misalignedTarget, 'alignedStatus': alignedStatus, 'misalignedStatus': misalignedStatus };
}