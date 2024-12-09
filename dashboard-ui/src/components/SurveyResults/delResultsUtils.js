export function setupVizElement(vizPanel, pageName) {
    // sets up the graph viz element 
    const vizElementId = "viz_" + pageName;
    const vizElement = document.getElementById(vizElementId);

    if (vizElement) {
        vizElement.innerHTML = "";
        vizPanel.render(vizElementId);

        const resizeObserver = new ResizeObserver(() => {
            vizPanel.layout();
        });
        resizeObserver.observe(vizElement);

        return () => {
            resizeObserver.disconnect();
            if (vizElement) {
                vizElement.innerHTML = "";
            }
        };
    }
}

export function getQuestionAnswerSets(pageName, config, genericName = null) {
    // cleans up questions and answers from the survey and puts them in the proper format to easily show in the graphs
    const pagesFound = config.pages.filter((page) => page.name === pageName);
    if (pagesFound.length > 0) {
        const page = pagesFound[0];
        const surveyJson = { elements: [] };
        for (const el of page.elements) {
            let override = false;
            if (el.type === 'radiogroup') {
                if (el.name.includes("Given the information provided")) {
                    override = true;
                }
                surveyJson.elements.push({
                    name: (genericName ? (genericName.split(':')[0] + ':' + el.name.slice(9)).replace('::', ':') : el.name),
                    title: override ? "Given the information provided, I would prefer" : (genericName ? (genericName.split(':')[0] + ':' + el.name.slice(9)).replace('::', ':') : el.name),
                    type: "radiogroup",
                    choices: override ? el.choices.map((choice) => choice.substr(15)) : el.choices
                });
            }
        }
        return surveyJson;
    }
    else if (pageName.includes('vs') && [4, 5].includes(config.version)) {
        // comparison pages are created during runtime in version 4 & 5, so we need to handle them differently
        return generateComparisonv45(pageName, genericName);
    }
    return {};
}

function generateComparisonv45(pageName, genericName) {
    const surveyJson = { elements: [] };
    const bname = pageName.split(' vs ')[0].trim();
    const aname = pageName.split(' vs ')[1].trim();
    const mname = pageName.split(' vs ')[2].trim();
    if (aname != '' && mname != '') {
        surveyJson.elements.push({
            name: genericName ? "Aligned vs Baseline: Forced Choice" : aname + " vs " + bname + ": Forced Choice",
            title: genericName ? "Aligned vs Baseline: Forced Choice" : aname + " vs " + bname + ": Forced Choice",
            type: "radiogroup",
            choices: genericName ? ["Aligned", "Baseline"] : [aname, bname]
        });
        surveyJson.elements.push({
            name: (genericName ? "Aligned vs Baseline" : aname + " vs " + bname) + ": Rate your confidence about the delegation decision indicated in the previous question",
            title: genericName ? "Aligned vs Baseline: Delegation Confidence" : aname + " vs " + bname + ": Delegation Confidence",
            type: "radiogroup",
            choices: ["Not confident at all", "Not confident", "Somewhat confident", "Confident", "Completely confident"]
        });
        surveyJson.elements.push({
            name: genericName ? "Aligned vs Misaligned: Forced Choice" : aname + " vs " + mname + ": Forced Choice",
            title: genericName ? "Aligned vs Misaligned: Forced Choice" : aname + " vs " + mname + ": Forced Choice",
            type: "radiogroup",
            choices: genericName ? ["Aligned", "Misaligned"] : [aname, mname]
        });
        surveyJson.elements.push({
            name: (genericName ? "Aligned vs Baseline" : aname + " vs " + mname) + ": Rate your confidence about the delegation decision indicated in the previous question",
            title: genericName ? "Aligned vs Misaligned: Delegation Confidence" : aname + " vs " + mname + ": Delegation Confidence",
            type: "radiogroup",
            choices: ["Not confident at all", "Not confident", "Somewhat confident", "Confident", "Completely confident"]
        });
    }
    else {
        const secondName = mname == '' ? aname : mname;
        surveyJson.elements.push({
            name: genericName ? ((secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") + "Forced Choice") : (secondName + " vs " + bname + ": Forced Choice"),
            title: genericName ? ((secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") + "Forced Choice") : (secondName + " vs " + bname + ": Forced Choice"),
            type: "radiogroup",
            choices: genericName ? [secondName == mname ? "Misaligned" : "Aligned", "Baseline"] : [secondName, bname]
        });
        surveyJson.elements.push({
            name: (genericName ? (secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") : (secondName + " vs " + bname)) + ": Rate your confidence about the delegation decision indicated in the previous question",
            title: genericName ? ((secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") + "Delegation Confidence") : (secondName + " vs " + bname + ": Delegation Confidence"),
            type: "radiogroup",
            choices: ["Not confident at all", "Not confident", "Somewhat confident", "Confident", "Completely confident"]
        });
    }
    return surveyJson;
}