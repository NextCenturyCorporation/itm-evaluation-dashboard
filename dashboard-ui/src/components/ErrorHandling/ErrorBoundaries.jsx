import React from "react";
import { AppErrorMessage } from "./AppErrorMessage";

export class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {

        return {
            hasError: true,
            error
        };

    }

    componentDidCatch(error, errorInfo) {

        console.error("React Error Boundary");
        console.error(error);
        console.error(errorInfo);

    }

    render() {

        if (this.state.hasError) {

            return (
                <AppErrorMessage
                    error={this.state.error}
                />
            );

        }

        return this.props.children;

    }

}