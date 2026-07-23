import React from 'react';
import './dre-rq.css';
import { PH2RQ8OWPart1 } from "./tables/ph2_rq8_ow_part1";
import { PH2RQ8OWPart2 } from "./tables/ph2_rq8_ow_part2";

export function OpenWorldADMs() {

    return (
        <>
            <div className="section-container">
                <h2>Open World Part 1</h2>
                <PH2RQ8OWPart1 />
            </div>
            <div className="section-container">
                <h2>Open World Part 2</h2>
                <PH2RQ8OWPart2 />
            </div>
        </>
    )
}
