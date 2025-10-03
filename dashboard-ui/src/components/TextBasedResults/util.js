// Utility function to shorten long survey answers for display
export function shortenAnswer(answer) {
    switch (answer) {
        case 'I mostly considered the potential to save the most lives.':
            return "Save the Most Lives";
        case 'I considered the intent to cause harm and the degree of responsibility for the situation.':
            return "Intent to Cause Harm/Responsibility";
        case 'I primarily considered the likely medical impact and tried to save the most lives.':
            return "Medical Impact/Save the Most Lives";
        case 'I considered the intent to cause harm, the degree of responsibility for the situation, and the potential to save the most lives.':
            return 'Intent to Cause Harm/Responsibility/Save the Most Lives';
        case 'The patient further from the IED':
            return "Patient further from IED"
        case 'The patient closer to the IED':
            return "Patient closer to IED";
        case 'Perform vitals assessment on Casualty W':
            return "Vitals: Casualty W";
        case 'Perform vitals assessment on Casualty X':
            return "Vitals: Casualty X";
        case 'Perform vitals assessment on Casualty V':
            return "Vitals: Casualty V";
        case 'Assess Casualty W for internal bleeding':
            return "Assess Casualty W";
        case 'Assess Casualty X for pelvic fracture':
            return "Assess Casualty X";
        case 'Provide burn dressing with pain control':
            return "Burn dressing and pain control";
        case 'Plan to treat both by alternating bag valve mask (BVM) ':
            return "Treat both with BVM";
        case 'Do not treat and search for help':
            return 'Search for help';
        case 'Apply Pain Med/Aid Bag to Casualty U':
            return 'Treat Casualty U: Pain Meds/Aid Bag';
        case 'Call to find out if additional support is possible':
            return 'Call for support';
        case 'Move forward with evacuating without confirming care capabilities':
            return 'Evacuate';
        case 'Hold casualties to determine if they can be transported':
            return 'Hold for transport';
        case 'Transport Casualty V to local hospital':
            return 'Casualty V: transport to local hospital';
        case 'Apply Decompression Needle to Casualty W':
            return 'Casualty W: Needle Treatment';
        case 'Check respiration on Casualty W':
            return 'Casualty W: Respiration';
        case 'Not assessing local capabilities and move forward with evacuating':
            return 'Evacuate';
        case 'Carefully divide the burn kit to cover the worst burns on each casualty':
            return 'Divide Burn Kit';
        case "Hold casualties until you get updated info on local hospital's capabilities to manage the casualties":
            return 'Hold until info on local hospital capabilities';
        case "Hold casualties until you get updated info on the capabilities of the embassy":
            return 'Hold until info on embassy capabilities';
        case "I considered the likely medical impact and also the intent to cause harm.":
            return "Medical Impact/Intent to Cause Harm";
        case "I considered the likely medical impact and also the degree of responsibility for the situation.":
            return "Medical Impact/Degree of Responsibility";
        case "Transport both casualties to the local hospital despite hospital availability":
            return "Transport both to hospital";
        case "Hold casualties to determine if they can be transported to safehouse":
            return "Hold for transport to safehouse";
        case "I considered the intent to cause harm, the degree of responsibility for the situation, and helpful things each patient had done.":
            return "Intent to Harm/Responsibility/Helpfulness of Patient";
        case "I considered the intent to cause harm, the degree of responsibility for the situation, the helpful things each patient had done, and the fact that the patients were from different groups":
            return "Intent/Responsibility/Helpfulness/Different Groups";
        case "Provide burn dressing with pain control (Burn kit)":
            return "Burn Kit";
        case "Perform an escharotomy (minor surgical kit)":
            return "Escharotomy";
        case "Get info on local hospital's capabilities to manage the casualties":
            return "Info on Local Hospital";
        case "Get info on the capabilities of the embassy to hold casualties until evacuation":
            return "Info on Embassy";
        case "I mostly considered the fact that the patients were from different groups.":
            return "Patients are from different groups";
        case 'Treat Patient A':
            return "Treat Patient A";
        case 'Treat Patient B':
            return "Treat Patient B";
        default:
            if (answer.includes("BVM")) {
                return "Treat both with BVM";
            }
            if (answer.includes("until you get updated info on the capabilities of the embassy")) {
                return 'Hold until info on embassy capabilities';
            }
            if (answer.toLowerCase().includes('because')) {
                let substring = answer.substring(answer.toLowerCase().indexOf('because'));
                return substring.charAt(0).toUpperCase() + substring.slice(1);
            }
            return answer;
    }
}

export const p2Attributes = [ 'PS-AF', 'AF', 'MF', 'SS', 'PS']
