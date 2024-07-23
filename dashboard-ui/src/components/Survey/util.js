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