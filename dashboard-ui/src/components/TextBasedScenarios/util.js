const mapAnswers = (scenario, scenarioMappings) => {
    const scenarioConfig = scenarioMappings[scenario.title.replace(' Scenario', '')];
    Object.entries(scenario).forEach(field => {
        if (!field[1].questions) { return; }
        Object.entries(field[1].questions).forEach(question => {
            if (!question[1].probe) { return; }
            const page = scenarioConfig.pages.find((page) => page.name === field[0]);
            const pageQuestion = page.elements.find((element) => element.name === question[0]);
            const indexOfAnswer = pageQuestion.choices.indexOf(question[1].response);
            let choice;
            if (scenario.title.includes("Adept")) {
                if (indexOfAnswer >= 0) {
                    choice = question[1].probe + '.';
                    choice += String.fromCharCode(65 + indexOfAnswer);
                } else {
                    console.error("Error mapping user selection to choice ID");
                }
            } else {
                choice = "choice-"+indexOfAnswer;
            }
            question[1].choice = choice;
        })
    })
};

module.exports = {mapAnswers}