import { Casualty } from "./casualtySlider"
export const getCasualtyArray = (tables, decisionMaker) => {
    let casualties = []

    tables.map((table) => {
        const url = table.lastChild.firstChild.firstChild.firstChild.src
        const name = table.firstChild.innerText
        const children = table.childNodes[1].childNodes[1].childNodes

        const salt = formatDivData(children[0].textContent)
        const sort = formatDivData(children[1].textContent)
        const pulse = formatDivData(children[2].textContent)
        const breath = formatDivData(children[3].textContent)
        const hearing = formatDivData(children[4].textContent)
        const mood = formatDivData(children[5].textContent)

        let matchingDecisions = []
        if (decisionMaker) {
            matchingDecisions = decisionMaker.filter((decision) => {
                return decision.actionData.some((entry) => {
                    return entry === name
                }
                );
            });
        }

        const casualty = new Casualty(name, url, salt, sort, pulse, breath, hearing, mood);

        if (decisionMaker) {
            if (matchingDecisions.length > 0) {
                matchingDecisions.forEach((matchingDecision) => {
                    casualty.actionsOnCasualty.push(matchingDecision);
                });
            }
        }

        casualties.push(casualty)
        return casualty
    })


    return casualties
}

export const formatDivData = (data) => {
    const words = data.split(' ');

    const formattedWords = words.map(word => {
        const cleanedWord = word.replace(/;/g, '');
        return cleanedWord.charAt(0).toUpperCase() + cleanedWord.slice(1).toLowerCase();
    });

    return formattedWords[0] + ": " + formattedWords[2]
}