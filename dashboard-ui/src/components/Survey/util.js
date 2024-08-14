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

export function shuffle (array) {
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

export const survey4_0_groups = [
    ['kitware', 'Adept Desert'],
    ['kitware', 'Adept Jungle'],
    ['kitware', 'Adept Urban'],
    ['kitware', 'SoarTech Desert'],
    ['kitware', 'SoarTech Jungle'],
    ['kitware', 'SoarTech Urban'],
    ['TAD', 'Adept Desert'],
    ['TAD', 'Adept Jungle'],
    ['TAD', 'Adept Urban'],
    ['TAD', 'SoarTech Desert'],
    ['TAD', 'SoarTech Jungle'],
    ['TAD', 'SoarTech Urban']
]