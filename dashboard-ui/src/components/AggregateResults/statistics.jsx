import { isDefined } from "./DataFunctions";

function getBoxWhiskerData(lst) {
    const cleanLst = getCleanLst(lst);
    cleanLst.sort((a, b) => a - b);

    // Calculate median, Q1, Q3
    const q1 = getMedian(cleanLst.slice(0, Math.floor(cleanLst.length / 2)));
    const q3 = getMedian(cleanLst.slice(Math.floor(cleanLst.length / 2)));

    // Calculate Interquartile Range
    const iqr = q3 - q1;

    // Define outlier bounds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Filter out outliers
    const filteredData = cleanLst.filter(value => value >= lowerBound && value <= upperBound);

    // Recalculate the box plot values with the filtered data
    const newMin = Math.min(...filteredData);
    const newMax = Math.max(...filteredData);
    const newQ1 = getMedian(filteredData.slice(0, Math.floor(filteredData.length / 2)));
    const newQ3 = getMedian(filteredData.slice(Math.floor(filteredData.length / 2)));
    const newMed = getMedian(filteredData);

    // Return the updated box whisker data
    return [newMin, newQ1, newQ3, newMax, newMed];
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

function getLogisticData(dataPoints) {
    const data = dataPoints.map((dp) => [dp.x, dp.y]);
    const learningRate = 0.01;
    const maxIterations = 10000;
    const threshold = 1e-6;

    let weights = [0, 0];

    const sigmoid = (z) => 1 / (1 + Math.exp(-z));

    for (let iter = 0; iter < maxIterations; iter++) {
        let gradients = [0, 0];
        let totalError = 0;

        for (const point of data) {
            const x = point[0];
            const y = point[1];
            const z = weights[0] * x + weights[1];
            const prediction = sigmoid(z);
            totalError += (y - prediction);

            gradients[0] += (y - prediction) * x;
            gradients[1] += (y - prediction);
        }

        for (let i = 0; i < weights.length; i++) {
            weights[i] += learningRate * gradients[i];
        }

        if (Math.abs(totalError) < threshold) {
            break;
        }
    }

    function predict(weights, x) {
        const z = weights[0] * x + weights[1];
        return 1 / (1 + Math.exp(-z));
    }

    return [...data, ...Array.from({ length: 100 }, (_, i) => i / 100)].map((x) => { return { x: x[0], y: predict(weights, x[0]) } }).sort((a, b) => a.x - b.x);

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

const getMeanAcrossAllWithoutOutliers = (obj, keys = 'all') => {
    const data = [];
    if (obj != undefined) {
        for (const key of Object.keys(obj)) {
            if (keys === 'all' || keys.includes(key)) {
                data.push(...obj[key]);
            }
        }
    }
    const cleanLst = getCleanLst(data);
    cleanLst.sort((a, b) => a - b);

    // Calculate median, Q1, Q3
    const q1 = getMedian(cleanLst.slice(0, Math.floor(cleanLst.length / 2)));
    const q3 = getMedian(cleanLst.slice(Math.floor(cleanLst.length / 2)));

    // Calculate Interquartile Range
    const iqr = q3 - q1;

    // Define outlier bounds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Filter out outliers
    const filteredData = cleanLst.filter(value => value >= lowerBound && value <= upperBound);
    return filteredData.reduce((a, b) => a + b, 0) / filteredData.length;
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
        { x: 0, y: b },
        { x: Math.min(...data.map((x) => x.x)), y: m * Math.min(...data.map((x) => x.x)) + b },
        { x: Math.max(...data.map((x) => x.x)), y: m * Math.max(...data.map((x) => x.x)) + b },
    ];
    return lineData;
};

export { getBoxWhiskerData, getMean, getMedian, getMode, getStandDev, getStandardError, getMeanAcrossAll, getSeAcrossAll, calculateBestFitLine, getLogisticData, getMeanAcrossAllWithoutOutliers };