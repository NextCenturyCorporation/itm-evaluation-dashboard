import React from "react";
import { AppErrorMessage } from "./AppErrorMessage";
import history from "../App/history";

export class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            hasError: false,
            errors: []
        };
    }

    static getDerivedStateFromError(error) {

        return {
            hasError: true,
            errors: Array.isArray(error) ? error : [error]
        };

    }

    componentDidCatch(error, errorInfo) {

        console.error("React Error Boundary");
        console.error(error);
        console.error(errorInfo);

    }

    // React boundaries only catch errors thrown while rendering. When catchUncaughtErrors is set, also
    // catch errors from event handlers, async code, and timers via the window's uncaught error events
    componentDidMount() {

        if (this.props.catchUncaughtErrors) {
            window.addEventListener('error', this.handleWindowError);
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
        }

    }

    componentWillUnmount() {

        this.unmounted = true;
        window.removeEventListener('error', this.handleWindowError);
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    }

    handleWindowError = (event) => {
        // cross-origin "Script error." has no error object, and ResizeObserver loop warnings are harmless
        if (!event.error || /ResizeObserver loop/.test(event.message)) {
            return;
        }
        this.showUncaughtError(event.error);
    }

    handleUnhandledRejection = (event) => {
        const reason = event.reason;
        this.showUncaughtError(reason instanceof Error || Array.isArray(reason)
            ? reason
            : new Error(`Unhandled promise rejection: ${String(reason)}`));
    }

    showUncaughtError = (error) => {
        // defer so state is never set mid-render
        setTimeout(() => {
            if (this.unmounted || this.state.hasError) {
                return;
            }
            console.error("Uncaught error outside of rendering");
            console.error(error);
            this.setState({ hasError: true, errors: Array.isArray(error) ? error : [error] });
        }, 0);
    }

    // clear the error when any of the resetKeys change (e.g. the route pathname)
    componentDidUpdate(prevProps) {

        const prev = prevProps.resetKeys || [];
        const next = this.props.resetKeys || [];
        const keysChanged = prev.length !== next.length || next.some((key, i) => !Object.is(key, prev[i]));

        if (this.state.hasError && keysChanged) {
            this.reset();
        }

    }

    reset = () => {
        this.setState({ hasError: false, errors: [] });
    }

    reload = () => {
        window.location.reload();
    }

    // reset explicitly as well, since the pathname won't change if the error occurred on the home page
    goHome = () => {
        history.push('/');
        this.reset();
    }

    render() {

        if (this.state.hasError) {

            return (
                <div className="error-boundary-container">
                    <AppErrorMessage errors={this.state.errors} onReload={this.reload} onGoHome={this.goHome}/>
                </div>
            );

        }

        return this.props.children;

    }

}
