import React from 'react';
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui";
export function ReviewTextBased() {
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    return (
        <div>
            <h1>Hello world</h1>
        </div>
    )
}