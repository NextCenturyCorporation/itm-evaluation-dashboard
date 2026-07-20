import { createBrowserHistory } from 'history';

export const routerBasename = process.env.REACT_APP_ROUTER_BASENAME || '';

const history = createBrowserHistory({
    basename: routerBasename
});

export default history;