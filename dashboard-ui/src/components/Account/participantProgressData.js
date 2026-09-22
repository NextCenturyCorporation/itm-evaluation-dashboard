import gql from 'graphql-tag';
import { evalNameToNumber } from '../OnlineOnly/config';
import { setScenarioCompletion, checkAlignmentStatus } from './progressUtils';

export const GET_PROGRESS_PAGE = gql`
    query GetParticipantProgress($filter: ParticipantProgressFilter!, $offset: Int!, $limit: Int!) {
        getParticipantProgress(filter: $filter, offset: $offset, limit: $limit)
    }
`;

export const GET_PROGRESS_DETAILS = gql`
    query GetParticipantProgressDetails($pid: String!) {
        getParticipantProgressDetails(pid: $pid)
    }
`;

const numberToEvalName = Object.fromEntries(Object.entries(evalNameToNumber).map(([name, num]) => [num, name]));

export const evaluationLabel = ({ evalNumber, evalName }) =>
    (numberToEvalName[evalNumber] ?? evalName ?? `Evaluation ${evalNumber}`).replace(/Phase 2\s*/g, '');

const formatDateTime = date => !Number.isNaN(date.getTime())
    ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${date.toLocaleTimeString('en-US', { hour12: false })}`
    : undefined;

export function formatProgressRows(rows, canViewProlific, origin) {
    return rows.map(record => {
        const text = record.textResults || [];
        const row = {
            'Participant ID': record.pid,
            'Participant Type': record.participantType,
            'Participant Creation Date-Time': record.createdAt,
            'Evaluation': evaluationLabel(record),
            'Sim Date-Time': formatDateTime(new Date(record.simTimestamp ?? undefined)),
            'Sim Count': record.simCount,
            'Delegation': record.delegationCount,
            'Text': record.textCount,
            _evalNumber: record.evalNumber,
            _phase: record.evalNumber >= 8 ? 2 : 1
        };
        for (const [source, label] of [
            ['delegationStart', 'Delegation Start'], ['delegationEnd', 'Delegation End'],
            ['textStart', 'Text Start'], ['textEnd', 'Text End']
        ]) {
            const date = new Date(record[source] ?? undefined);
            row[`Unformatted ${label}`] = date;
            row[`${label.replace('Delegation', 'Del')} Date-Time`] = formatDateTime(date);
        }
        (record.simScenarios || []).forEach((scenario, index) => { row[`Sim-${index + 1}`] = scenario; });
        (record.delegationScenarios || []).forEach((scenario, index) => { row[`Del-${index + 1}`] = scenario; });
        setScenarioCompletion(row, text.map(result => result.scenario_id).filter(Boolean));
        if (record.evalNumber >= 8) {
            const status = checkAlignmentStatus(text, record.pid);
            row['_alignmentStatus'] = status;
            row['Alignment Status'] = status.totalScenarios === 0 ? 'No Data'
                : status.allPopulated ? `Complete (${status.totalScenarios})`
                    : `Missing (${status.missingCount}/${status.totalScenarios})`;
        }
        if (canViewProlific) {
            row['Prolific ID'] = record.prolificId;
            row['Contact ID'] = record.contactId;
            row['Survey Link'] = null;
            if (record.prolificId && record.textCount >= (record.evalNumber >= 8 ? 4 : 5)) {
                const entry = record.evalNumber >= 8 || record.pid.startsWith('202506') ? 'caciProlific' : 'adeptQualtrix';
                row['Survey Link'] = `${origin}/remote-text-survey?${entry}=true&PROLIFIC_PID=${record.prolificId}&ContactID=${record.contactId}&pid=${record.pid}&class=Online&startSurvey=true`;
            }
        }
        return row;
    });
}

// Export reads are deliberately separate from the visible page and never use its row array.
export async function fetchProgressExport(client, filter) {
    const rows = [];
    const limit = 200;
    let total = Infinity;
    while (rows.length < total) {
        const { data } = await client.query({
            query: GET_PROGRESS_PAGE, variables: { filter, offset: rows.length, limit }, fetchPolicy: 'no-cache'
        });
        const page = data.getParticipantProgress;
        total = page.totalCount;
        if (!page.rows.length) break;
        rows.push(...page.rows);
    }
    return rows;
}
