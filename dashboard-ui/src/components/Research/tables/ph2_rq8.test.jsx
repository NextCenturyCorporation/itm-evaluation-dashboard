import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { useQuery } from "react-apollo";
import * as XLSX from "xlsx-js-style";
import { PH2RQ8 } from "./ph2_rq8";
import { DownloadButtons } from "./download-buttons";

jest.mock("react-apollo", () => ({ useQuery: jest.fn() }));
jest.mock("xlsx-js-style", () => ({
    read: jest.fn(),
    utils: { sheet_to_json: jest.fn() }
}));
jest.mock("../variables/rq-variables", () => ({ RQDefinitionTable: () => null }));
jest.mock("./download-buttons", () => ({ DownloadButtons: jest.fn(() => null) }));
jest.mock("@mui/material", () => ({ Modal: () => null }));
jest.mock("@material-ui/icons/Close", () => () => null);

const ATTRIBUTES = { AF: "affiliation", MF: "merit", PS: "personal_safety", SS: "search" };
const PARAMETERS = { intercept: "intercept", medical: "medical_weight", attribute: "attr_weight" };
const REFRESH_FIELDS = [
    ...Object.keys(ATTRIBUTES).map((shortName) => `${shortName}_midpoint_Text`),
    ...["Desert", "Urban"].flatMap((environment) => ["AF", "MF"].flatMap((shortName) => [
        ...Object.keys(PARAMETERS).map((parameter) => `${shortName}_${parameter}_${environment}`),
        `${shortName}_midpoint_${environment}`,
        `${shortName} Alignment_${environment}`,
        `${shortName} Midpoint Alignment_${environment}`
    ]))
];
const TEXT_FIELDS = Object.keys(ATTRIBUTES).flatMap((shortName) =>
    Object.keys(PARAMETERS).map((parameter) => `${shortName}_${parameter}_Text`)
);
const DEFINITION_FIELDS = [...TEXT_FIELDS, ...REFRESH_FIELDS, "Desert Probe_AF1"];

function profile(values) {
    return ["affiliation", "merit"].map((kdma) => ({
        kdma,
        parameters: Object.values(PARAMETERS).map((name, index) => ({ name, value: values[index] }))
    }));
}

function fixture(evalNumber, pid = "123") {
    const textResults = Object.entries(ATTRIBUTES).map(([shortName, kdma]) => ({
        _id: `${pid}-${shortName}`,
        participantID: pid,
        evalNumber,
        scenario_id: evalNumber === 15 ? `Feb2026-${shortName}1-assess` : `June2026-${shortName}-assess`,
        timeComplete: 100,
        combinedSessionId: `${pid}-text-current-${kdma}`,
        combinedSessionId_old: `${pid}-text-old-${kdma}`
    }));
    const simulations = ["Desert", "Urban"].map((environment) => {
        const currentSid = `${pid}-${environment}-current`;
        const oldSid = `${pid}-${environment}-old`;
        const entry = {
            _id: `${pid}-${environment}`,
            pid,
            evalNumber,
            openWorld: true,
            env: `feb2026-${environment.toLowerCase()}-openworld`,
            scenario_id: `Feb2026-OW_${environment.toLowerCase()}`,
            data: {
                data: [],
                alignment: {
                    sid: currentSid,
                    sid_old: oldSid,
                    kdmas: profile([1.111, 2.222, 3.333]),
                    kdmas_old: profile([0, -2.345, 0.678])
                }
            },
            text_kdmas: {},
            actionAnalysis: { "Desert Probe_AF1": "Patient A" },
            midpoint_values: { text: {}, open_world: {} },
            midpoint_alignment_scores: {}
        };
        for (const [shortName, kdma] of Object.entries(ATTRIBUTES)) {
            for (const parameter of Object.values(PARAMETERS)) {
                entry.text_kdmas[`Participant Text ${shortName} ${parameter} KDMA`] = 0.62;
                entry.text_kdmas[`Participant Text ${shortName} ${parameter} KDMA_old`] = 999;
            }
            entry.midpoint_values.text[kdma] = { sid: `${pid}-text-current-${kdma}`, value: 0.7 };
            entry.midpoint_values.text[`${kdma}_old`] = { sid: `${pid}-text-old-${kdma}`, value: 0.2 };
            if (!["AF", "MF"].includes(shortName)) continue;
            entry.actionAnalysis[`${shortName} Alignment_${environment}`] = -1.111;
            entry.actionAnalysis[`${shortName} Alignment_${environment}_old`] = -2.345;
            entry.midpoint_values.open_world[kdma] = { sid: currentSid, value: 0.8 };
            entry.midpoint_values.open_world[`${kdma}_old`] = { sid: oldSid, value: 0.4 };
            entry.midpoint_alignment_scores[kdma] = {
                open_world_sid: currentSid,
                text_sid: `${pid}-text-current-${kdma}`,
                score: 0.9
            };
            entry.midpoint_alignment_scores[`${kdma}_old`] = {
                open_world_sid: oldSid,
                text_sid: `${pid}-text-old-${kdma}`,
                score: 0.1
            };
            if (evalNumber !== 15) {
                entry.alignment_scores = entry.alignment_scores || {};
                entry.alignment_scores[`${shortName} Alignment_${environment}`] = -3.333;
                entry.alignment_scores[`${shortName} Alignment_${environment}_old`] = -4.567;
            }
        }
        return entry;
    });
    return {
        getAllSimAlignment: simulations,
        getAllScenarioResults: textResults,
        getParticipantLog: [{ ParticipantID: Number(pid), Type: "Participant", "AF-text-scenario": "Set 1" }]
    };
}

function exportProps() {
    return DownloadButtons.mock.calls[DownloadButtons.mock.calls.length - 1][0];
}

async function show(evalNumber, data = fixture(evalNumber)) {
    useQuery.mockReturnValue({ loading: false, data });
    render(<PH2RQ8 evalNum={evalNumber} />);
    await waitFor(() => expect(screen.queryByRole("table")).not.toBeNull());
    await waitFor(() => {
        const exported = exportProps();
        expect(exported.filteredData).toEqual(exported.formattedData);
        expect(exported.HEADERS.length).toBeGreaterThan(0);
    });
    return exportProps();
}

function removeBackups(entry) {
    delete entry.data.alignment.kdmas_old;
    delete entry.data.alignment.sid_old;
    for (const key of Object.keys(entry.actionAnalysis)) {
        if (key.endsWith("_old")) delete entry.actionAnalysis[key];
    }
    for (const key of Object.keys(entry.alignment_scores || {})) {
        if (key.endsWith("_old")) delete entry.alignment_scores[key];
    }
    for (const modality of Object.values(entry.midpoint_values)) {
        for (const key of Object.keys(modality)) {
            if (key.endsWith("_old")) delete modality[key];
        }
    }
    for (const key of Object.keys(entry.midpoint_alignment_scores)) {
        if (key.endsWith("_old")) delete entry.midpoint_alignment_scores[key];
    }
}

beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(0) });
    XLSX.read.mockReturnValue({ SheetNames: ["Definitions"], Sheets: { Definitions: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue([["Variables", ...DEFINITION_FIELDS]]);
});

afterEach(() => {
    cleanup();
    delete global.fetch;
});

describe("preserved RQ8 values", () => {
    test.each([15, 18, 19])("shows and exports exactly 28 adjacent old columns for eval %i", async (evalNumber) => {
        const { HEADERS, formattedData, filteredData } = await show(evalNumber);
        const oldHeaders = HEADERS.filter((field) => field.endsWith("_old"));
        expect(oldHeaders).toHaveLength(28);
        expect(new Set(oldHeaders)).toEqual(new Set(REFRESH_FIELDS.map((field) => `${field}_old`)));
        for (const field of REFRESH_FIELDS) {
            expect(HEADERS[HEADERS.indexOf(field) + 1]).toBe(`${field}_old`);
        }
        for (const field of TEXT_FIELDS) {
            expect(HEADERS).toContain(field);
            expect(HEADERS).not.toContain(`${field}_old`);
            expect(formattedData[0][field]).toBe(0.62);
        }
        expect(HEADERS).not.toContain("Desert Probe_AF1_old");
        expect(formattedData[0].AF_intercept_Desert).toBe(1.11);
        expect(formattedData[0].AF_intercept_Desert_old).toBe(0);
        expect(formattedData[0].AF_medical_Desert_old).toBe(-2.35);
        expect(formattedData[0].MF_attribute_Urban_old).toBe(0.68);
        expect(formattedData[0]["MF Alignment_Desert"]).toBe(evalNumber === 15 ? -1.11 : -3.33);
        expect(formattedData[0]["MF Alignment_Desert_old"]).toBe(evalNumber === 15 ? -2.35 : -4.57);
        expect(formattedData[0].AF_midpoint_Text).toBe(0.7);
        expect(formattedData[0].AF_midpoint_Text_old).toBe(0.2);
        expect(formattedData[0].MF_midpoint_Urban_old).toBe(0.4);
        expect(formattedData[0]["AF Midpoint Alignment_Desert"]).toBe(0.9);
        expect(formattedData[0]["AF Midpoint Alignment_Desert_old"]).toBe(0.1);
        expect(filteredData).toEqual(formattedData);
        expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(HEADERS);
        const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
        expect(cells[HEADERS.indexOf("AF_intercept_Desert_old")].textContent).toBe("0");
        expect(cells[HEADERS.indexOf("MF Alignment_Desert_old")].textContent).toBe(evalNumber === 15 ? "-2.35" : "-4.57");
    });

    test.each([15, 18, 19])("hides absent backups for eval %i without copying current values", async (evalNumber) => {
        const data = fixture(evalNumber);
        data.getAllSimAlignment.forEach(removeBackups);
        data.getAllScenarioResults.forEach((document) => delete document.combinedSessionId_old);
        const { HEADERS, formattedData } = await show(evalNumber, data);
        expect(HEADERS.filter((field) => field.endsWith("_old"))).toEqual([]);
        for (const field of REFRESH_FIELDS) {
            expect(HEADERS).toContain(field);
            expect(formattedData[0][`${field}_old`]).toBe("");
        }
    });

    test("validates historical midpoint sessions against old IDs rather than current IDs", async () => {
        const data = fixture(15);
        const desert = data.getAllSimAlignment[0];
        desert.midpoint_values.open_world.affiliation_old.sid = desert.data.alignment.sid;
        desert.midpoint_alignment_scores.affiliation_old.open_world_sid = desert.data.alignment.sid;
        desert.midpoint_alignment_scores.merit_old.text_sid = data.getAllScenarioResults.find((result) =>
            result.scenario_id === "Feb2026-MF1-assess"
        ).combinedSessionId;
        const { HEADERS, formattedData } = await show(15, data);
        expect(HEADERS).not.toContain("AF_midpoint_Desert_old");
        expect(HEADERS).not.toContain("AF Midpoint Alignment_Desert_old");
        expect(HEADERS).not.toContain("MF Midpoint Alignment_Desert_old");
        expect(formattedData[0].AF_midpoint_Desert).toBe(0.8);
        expect(formattedData[0]["AF Midpoint Alignment_Desert"]).toBe(0.9);
        expect(formattedData[0]["MF Midpoint Alignment_Urban_old"]).toBe(0.1);
    });

    test("uses the latest matching historical text session and ignores other evaluations", async () => {
        const data = fixture(18);
        data.getAllScenarioResults.push({
            ...data.getAllScenarioResults[0],
            _id: "earlier-AF",
            timeComplete: 99,
            combinedSessionId_old: "earlier-session"
        }, {
            ...data.getAllScenarioResults[0],
            _id: "different-eval-AF",
            evalNumber: 19,
            timeComplete: 101,
            combinedSessionId_old: "wrong-evaluation-session"
        });
        const { formattedData } = await show(18, data);
        expect(formattedData[0]["AF Midpoint Alignment_Desert_old"]).toBe(0.1);
    });

    test("keeps missing backups blank when another participant makes the column visible", async () => {
        const first = fixture(15, "123");
        const second = fixture(15, "456");
        delete first.getAllSimAlignment[0].data.alignment.kdmas_old;
        const combined = Object.fromEntries(Object.keys(first).map((key) => [key, [...first[key], ...second[key]]]));
        const { HEADERS, formattedData } = await show(15, combined);
        expect(HEADERS).toContain("AF_intercept_Desert_old");
        expect(formattedData[0].AF_intercept_Desert_old).toBe("");
        expect(formattedData[0].AF_intercept_Desert).toBe(1.11);
        expect(formattedData[1].AF_intercept_Desert_old).toBe(0);
    });

    test("does not display invalid or null historical midpoint values", async () => {
        const data = fixture(15);
        for (const entry of data.getAllSimAlignment) {
            entry.midpoint_values.text.affiliation_old.value = NaN;
            entry.midpoint_values.text.merit_old = null;
            entry.midpoint_values.text.personal_safety_old.value = Infinity;
            entry.midpoint_values.text.search_old.value = -0.1;
            entry.midpoint_values.open_world.affiliation_old.value = 1.1;
            entry.midpoint_values.open_world.merit_old.value = null;
            entry.midpoint_alignment_scores.affiliation_old.score = NaN;
            entry.midpoint_alignment_scores.merit_old.score = null;
        }
        const { HEADERS, formattedData } = await show(15, data);
        expect(HEADERS.filter((field) => field.endsWith("_old") && field.includes("midpoint"))).toEqual([]);
        expect(HEADERS.filter((field) => field.endsWith("_old") && field.includes("Midpoint"))).toEqual([]);
        expect(formattedData[0].AF_midpoint_Text).toBe(0.7);
        expect(formattedData[0]["AF Midpoint Alignment_Desert"]).toBe(0.9);
    });

    test("preserves valid zero midpoint values and scores", async () => {
        const data = fixture(15);
        for (const entry of data.getAllSimAlignment) {
            entry.midpoint_values.text.affiliation_old.value = 0;
            entry.midpoint_values.open_world.affiliation_old.value = 0;
            entry.midpoint_alignment_scores.affiliation_old.score = 0;
        }
        const { HEADERS, formattedData } = await show(15, data);
        for (const field of ["AF_midpoint_Text_old", "AF_midpoint_Desert_old", "AF Midpoint Alignment_Desert_old"]) {
            expect(HEADERS).toContain(field);
            expect(formattedData[0][field]).toBe(0);
        }
    });

    test("does not replace explicit null or invalid coefficient and alignment backups", async () => {
        const data = fixture(18);
        const desert = data.getAllSimAlignment[0];
        desert.data.alignment.kdmas_old[0].parameters[0].value = null;
        desert.data.alignment.kdmas_old[1].parameters[1].value = NaN;
        desert.alignment_scores["AF Alignment_Desert_old"] = null;
        desert.alignment_scores["MF Alignment_Desert_old"] = Infinity;
        const { HEADERS, formattedData } = await show(18, data);
        for (const field of ["AF_intercept_Desert_old", "MF_medical_Desert_old", "AF Alignment_Desert_old", "MF Alignment_Desert_old"]) {
            expect(HEADERS).not.toContain(field);
            expect(formattedData[0][field]).toBe("");
        }
        expect(formattedData[0]["AF Alignment_Desert"]).toBe(-3.33);
    });

    test("supports value-only refreshes whose session IDs did not change", async () => {
        const data = fixture(19);
        data.getAllScenarioResults.forEach((result) => delete result.combinedSessionId_old);
        for (const entry of data.getAllSimAlignment) {
            delete entry.data.alignment.sid_old;
            for (const [shortName, kdma] of Object.entries(ATTRIBUTES)) {
                const textSid = data.getAllScenarioResults.find((result) =>
                    result.scenario_id === `June2026-${shortName}-assess`
                ).combinedSessionId;
                entry.midpoint_values.text[`${kdma}_old`].sid = textSid;
                if (!["AF", "MF"].includes(shortName)) continue;
                entry.midpoint_values.open_world[`${kdma}_old`].sid = entry.data.alignment.sid;
                entry.midpoint_alignment_scores[`${kdma}_old`].open_world_sid = entry.data.alignment.sid;
                entry.midpoint_alignment_scores[`${kdma}_old`].text_sid = textSid;
            }
        }
        const { HEADERS, formattedData } = await show(19, data);
        expect(HEADERS.filter((field) => field.endsWith("_old"))).toHaveLength(28);
        expect(formattedData[0]["AF Midpoint Alignment_Desert_old"]).toBe(0.1);
        expect(formattedData[0].AF_midpoint_Desert_old).toBe(0.4);
    });

    test("does not duplicate old fields already present in workbook definitions", async () => {
        XLSX.utils.sheet_to_json.mockReturnValue([["Variables", ...DEFINITION_FIELDS, "AF_midpoint_Text_old"]]);
        const { HEADERS } = await show(15);
        expect(HEADERS.filter((field) => field === "AF_midpoint_Text_old")).toHaveLength(1);
        expect(HEADERS[HEADERS.indexOf("AF_midpoint_Text") + 1]).toBe("AF_midpoint_Text_old");
    });

    test("does not add old columns for unrelated evaluations", async () => {
        const { HEADERS } = await show(16);
        expect(HEADERS.filter((field) => field.endsWith("_old"))).toEqual([]);
        expect(HEADERS).toContain("MF Alignment_Desert");
    });
});
