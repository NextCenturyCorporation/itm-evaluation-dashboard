/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useQuery } from 'react-apollo';
import { formatProgressRows, fetchProgressExport } from '../src/components/Account/participantProgressData';
import { useParticipantProgress } from '../src/components/Account/useParticipantProgress';
import { ParticipantProgressTable } from '../src/components/Account/participantProgress';
import { findParticipantByEmail, findParticipantByPid, getNextParticipantId } from '../src/services/participantService';
import { apolloClient } from '../src/services/accountsService';

jest.mock('react-apollo', () => ({ useQuery: jest.fn(), useMutation: () => [jest.fn()] }));
jest.mock('../src/components/TextBasedScenarios/adeptUtils', () => ({}));
jest.mock('../src/components/OnlineOnly/config', () => ({ evalNameToNumber: { 'Phase 2 June': 17, 'Phase 2 April': 16 } }));
jest.mock('../src/services/accountsService', () => ({ apolloClient: { query: jest.fn() }, accountsClient: {} }));
jest.mock('../src/components/Research/utils', () => ({ exportToExcel: jest.fn() }));
jest.mock('../src/components/AggregateResults/DataFunctions', () => ({ isDefined: value => value != null }));
jest.mock('../src/components/Account/admInfoModal', () => () => null);
jest.mock('../src/components/Account/repairAlignmentModal', () => () => null);

const record = (i = 0) => ({
    pid: String(202600000 + i), participantType: 'Mil', evalNumber: 17, simCount: 0,
    textCount: 4, delegationCount: 1, delegationScenarios: ['Medic scenario'],
    textResults: [{ participantID: String(202600000 + i), scenario_id: 'June2026-AF-assess', evalNumber: 17, alignmentPopulated: true }]
});
const operation = document => document.definitions[0].name.value;
beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => { jest.useRealTimers(); });

test('exports retrieve every matching page and preserve filters', async () => {
    const all = Array.from({ length: 450 }, (_, i) => record(i));
    const filter = { phase: 'Phase 2', evalNumbers: [17], participantTypes: ['Mil'] };
    const client = { query: jest.fn(async ({ variables }) => ({ data: { getParticipantProgress: {
        rows: all.slice(variables.offset, variables.offset + variables.limit), totalCount: all.length
    } } })) };
    expect(await fetchProgressExport(client, filter)).toEqual(all);
    expect(client.query.mock.calls.map(([args]) => args.variables.offset)).toEqual([0, 200, 400]);
    expect(client.query.mock.calls.every(([args]) => args.variables.filter === filter && args.variables.limit === 200)).toBe(true);
    client.query.mockRejectedValueOnce(new Error('Disconnected'));
    await expect(fetchProgressExport(client, filter)).rejects.toThrow('Disconnected');
});

test('compact summaries retain scenario columns, alignment status, dates and permission-based columns', () => {
    const source = { ...record(), simTimestamp: null, prolificId: 'prolific', contactId: 'contact' };
    const [row] = formatProgressRows([source], false, 'https://dashboard.example');
    expect(row.Evaluation).toBe('June');
    expect(row['AF-Bi']).toBe('y');
    expect(row['Alignment Status']).toBe('Complete (1)');
    expect(row['Prolific ID']).toBeUndefined();
    expect(row['Sim Date-Time']).toBeUndefined();
    expect(row['Del End Date-Time']).toBeUndefined();
    expect(Number.isNaN(row['Unformatted Delegation End'].getTime())).toBe(true);
    const [allowed] = formatProgressRows([source], true, 'https://dashboard.example');
    expect(allowed['Survey Link']).toContain('caciProlific=true&PROLIFIC_PID=prolific');
});

test('page requests use offsets, descending sorting and debounced search resetting to page one', () => {
    jest.useFakeTimers();
    const data = { getParticipantProgress: { rows: [record()], totalCount: 120, evaluations: [] } };
    useQuery.mockReturnValue({ data, loading: false, refetch: jest.fn() });
    const props = { selectedPhase: 'Phase 2', evalFilters: [{ evalNumber: 17 }], typeFilters: ['Mil'], completionFilters: [], searchPid: '', sortBy: 'Text Count \u2193', canViewProlific: false };
    const { result, rerender } = renderHook(props => useParticipantProgress(props), { initialProps: props });
    act(() => jest.advanceTimersByTime(250));
    act(() => result.current.setPage(1));
    expect(useQuery.mock.calls.at(-1)[1].variables).toMatchObject({ offset: 50, limit: 50, filter: { evalNumbers: [17], sortField: 'textCount', descending: true } });
    rerender({ ...props, searchPid: '20260001' });
    expect(result.current.filter.searchPid).toBe('');
    act(() => jest.advanceTimersByTime(250));
    expect(useQuery.mock.calls.at(-1)[1].variables).toMatchObject({ offset: 0, filter: { searchPid: '20260001' } });
});

test('table navigation and evaluation filters request new pages; details stay lazy and PID-scoped', () => {
    useQuery.mockImplementation((document, { variables }) => {
        if (operation(document) === 'GetParticipantProgressDetails') return { loading: false };
        const total = variables.filter.evalNumbers.length ? 20 : 120;
        return { loading: false, refetch: jest.fn(), data: { getParticipantProgress: {
            rows: [record(variables.offset)], totalCount: total, phaseCount: 120,
            participantTypes: ['Mil'], evaluations: [{ evalNumber: 17 }, { evalNumber: 16 }]
        } } };
    });
    const lastPage = () => useQuery.mock.calls.filter(([doc]) => operation(doc) === 'GetParticipantProgress').at(-1)[1];
    const lastDetails = () => useQuery.mock.calls.filter(([doc]) => operation(doc) === 'GetParticipantProgressDetails').at(-1)[1];
    render(<ParticipantProgressTable />);
    expect(screen.getByText('120 matching participants of 120 in this phase')).toBeTruthy();
    expect(lastDetails().skip).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(lastPage().variables.offset).toBe(50);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Eval' }));
    fireEvent.click(screen.getByRole('option', { name: 'April' }));
    expect(lastPage().variables).toMatchObject({ offset: 0, filter: { evalNumbers: [16] } });
    expect(screen.getByText('20 matching participants of 120 in this phase')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Medic scenario' }));
    expect(lastDetails()).toMatchObject({ skip: false, variables: { pid: '202600000' } });
});

test('participant entry services fetch one match and propagate network errors', async () => {
    apolloClient.query.mockResolvedValueOnce({ data: { getParticipantByEmail: { ParticipantID: 123 } } });
    expect(await findParticipantByEmail('hash', 17)).toEqual({ ParticipantID: 123 });
    expect(apolloClient.query.mock.calls.at(-1)[0]).toMatchObject({ variables: { hashedEmail: 'hash', evalNumber: 17 }, fetchPolicy: 'no-cache' });
    apolloClient.query.mockResolvedValueOnce({ data: { getParticipantByPid: null } });
    expect(await findParticipantByPid('123')).toBeNull();
    apolloClient.query.mockResolvedValueOnce({ data: { getNextParticipantId: 124 } });
    expect(await getNextParticipantId()).toBe(124);
    apolloClient.query.mockRejectedValueOnce(new Error('Disconnected'));
    await expect(findParticipantByPid('123')).rejects.toThrow('Disconnected');
    expect(apolloClient.query.mock.calls.every(([args]) => !args.query.loc.source.body.includes('getParticipantLog'))).toBe(true);
});
