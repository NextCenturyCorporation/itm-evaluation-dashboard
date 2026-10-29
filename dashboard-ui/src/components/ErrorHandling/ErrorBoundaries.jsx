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
