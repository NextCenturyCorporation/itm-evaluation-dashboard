import React from 'react';
import { useQuery } from 'react-apollo';
import { GET_PROGRESS_PAGE, formatProgressRows } from './participantProgressData';

export function useParticipantProgress({ selectedPhase, evalFilters, typeFilters, completionFilters, searchPid, sortBy, canViewProlific }) {
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(50);
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    React.useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchPid); setPage(0); }, 250);
        return () => clearTimeout(timer);
    }, [searchPid]);

    const filter = React.useMemo(() => {
        const sortFields = { 'Participant ID': 'pid', 'Text Start Time': 'textStart', 'Sim Count': 'simCount', 'Del Count': 'delegationCount', 'Text Count': 'textCount' };
        return {
            phase: selectedPhase, evalNumbers: evalFilters.map(option => option.evalNumber),
            participantTypes: typeFilters, completionFilters, searchPid: debouncedSearch,
            sortField: sortFields[sortBy.split(' ').slice(0, -1).join(' ')] || 'pid',
            descending: sortBy.endsWith('↓')
        };
    }, [selectedPhase, evalFilters, typeFilters, completionFilters, debouncedSearch, sortBy]);

    const { data, loading, error, refetch } = useQuery(GET_PROGRESS_PAGE, {
        variables: { filter, offset: page * pageSize, limit: pageSize },
        fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true
    });
    const progress = data?.getParticipantProgress;
    const rows = React.useMemo(() => formatProgressRows(progress?.rows || [], canViewProlific, window.location.origin), [progress, canViewProlific]);
    const evalOptions = React.useMemo(() => Array.from(new Map((progress?.evaluations || [])
        .map(option => [option.evalNumber, option])).values()).sort((a, b) => b.evalNumber - a.evalNumber), [progress]);

    React.useEffect(() => {
        if (!loading && progress && page > 0 && page * pageSize >= progress.totalCount) {
            setPage(Math.max(0, Math.ceil(progress.totalCount / pageSize) - 1));
        }
    }, [loading, progress, page, pageSize]);

    return { progress, rows, evalOptions, filter, page, setPage, pageSize, setPageSize, loading, error, refetch };
}
