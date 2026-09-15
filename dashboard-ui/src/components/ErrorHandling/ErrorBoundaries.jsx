import React from "react";
import { AppErrorMessage } from "./AppErrorMessage";

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

    render() {

        if (this.state.hasError) {

            return (
                <div className="error-boundary-container">
                    <AppErrorMessage errors={this.state.errors}/>
                </div>
            );

        }

        return this.props.children;

    }

}