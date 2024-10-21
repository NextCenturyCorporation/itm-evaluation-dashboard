import { isDefined } from "./DataFunctions";

function getBoxWhiskerData(lst) {
    const cleanLst = getCleanLst(lst);
    // returns [min, q1, q3, max, median] for a list of data
    cleanLst.sort((a, b) => a - b);
    const med = getMedian(cleanLst);
    const q1 = getMedian(cleanLst.slice(0, Math.floor(cleanLst.length / 2)));
    const q3 = getMedian(cleanLst.slice(Math.floor(cleanLst.length / 2)));
    return [Math.min(...cleanLst), q1, q3, Math.max(...cleanLst), med];
}

function getMedian(lst) {
    const cleanLst = getCleanLst(lst);
    cleanLst.sort((a, b) => a - b);
    if (cleanLst.length % 2 === 0) {
        return (cleanLst[Math.floor(cleanLst.length / 2) - 1] + cleanLst[Math.floor(cleanLst.length / 2)]) / 2;
    }
    else {
        // if odd, just grab middle val
        return cleanLst[Math.floor(cleanLst.length / 2) + 1];
    }
}

function getCleanLst(lst) {
    return [...lst].filter((x) => isDefined(x));
}

function getMean(lst) {
    const cleanLst = getCleanLst(lst);
    return cleanLst.reduce((a, b) => a + b, 0) / cleanLst.length;
}

function getMode(lst) {
    const cleanLst = getCleanLst(lst);
    const counts = {};
    for (const x of cleanLst) {
        if (Object.keys(counts).includes(x.toString())) {
            counts[x.toString()] += 1;
        } else {
            counts[x.toString()] = 1;
        }
    }
    let mode = [];
    let count = -1;
    for (const x of Object.keys(counts)) {
        if (counts[x] > count) {
            mode = [x];
            count = counts[x];
        }
        else if (counts[x] === count) {
            mode.push(x);
        }
    }
    return mode.length === lst.length ? 'None' : mode.join(', ');
}

function getStandDev(lst) {
    const cleanLst = getCleanLst(lst);
    const m = getMean(cleanLst);
    let sum = 0;
    for (const x of cleanLst) {
        sum += (x - m) ** 2; // square each value minus the mean, add it together
    }
    return Math.sqrt(sum / cleanLst.length);
}

function getStandardError(lst) {
    const cleanLst = getCleanLst(lst);
    const sd = getStandDev(cleanLst);
    const se = sd / Math.sqrt(cleanLst.length);
    const mean = getMean(lst);
    return [mean - se, mean + se];
}

const getMeanAcrossAll = (obj, keys = 'all') => {
    const data = [];
    if (obj != undefined) {
        for (const key of Object.keys(obj)) {
            if (keys === 'all' || keys.includes(key)) {
                data.push(...obj[key]);
            }
        }
    }
    return getMean(data);
};

const getSeAcrossAll = (obj, keys = 'all') => {
    const data = [];
    if (obj != undefined) {
        for (const key of Object.keys(obj)) {
            if (keys === 'all' || keys.includes(key)) {
                data.push(...obj[key]);
            }
        }
    }
    return getStandardError(data);
};


const calculateBestFitLine = (data) => {
    const n = data.length;
    const sumX = data.reduce((acc, point) => acc + point.x, 0);
    const sumY = data.reduce((acc, point) => acc + point.y, 0);
    const sumXY = data.reduce((acc, point) => acc + point.x * point.y, 0);
    const sumX2 = data.reduce((acc, point) => acc + point.x * point.x, 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    const lineData = [
        { x: Math.min(...data.map((x) => x.x)), y: m * Math.min(...data.map((x) => x.x)) + b },
        { x: Math.max(...data.map((x) => x.x)), y: m * Math.max(...data.map((x) => x.x)) + b },
    ];
    return lineData;
};

export { getBoxWhiskerData, getMean, getMedian, getMode, getStandDev, getStandardError, getMeanAcrossAll, getSeAcrossAll, calculateBestFitLine };