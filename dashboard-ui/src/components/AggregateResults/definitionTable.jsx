import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import mreXlFile from './Variable Definitions/MRE_Variables.xlsx';
import dreXlFile from './Variable Definitions/DRE_Variables.xlsx';
import ph1XlFile from './Variable Definitions/PH1_Variables.xlsx'
import ph2XlFile from './Variable Definitions/PH2_Variables.xlsx'

const getDefinitionFile = (evalNumber) => {
    if (evalNumber === 4) return { file: dreXlFile, prefix: 'dre_' };
    if (evalNumber === 5 || evalNumber === 12) return { file: ph1XlFile, prefix: 'ph1_' };
    if (evalNumber >= 8) return { file: ph2XlFile, prefix: 'ph2_' };
    return { file: mreXlFile, prefix: 'mre_' };
};

export function DefinitionTable({ evalNumber }) {
    const [defs, setDefs] = React.useState(null);

    React.useEffect(() => {
        const { file: xlFile } = getDefinitionFile(evalNumber);
        const oReq = new XMLHttpRequest();
        oReq.open("GET", xlFile, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function () {
            var arraybuffer = oReq.response;
            const wb = XLSX.read(arraybuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].length; j++) {
                    if (data[i][j] === undefined) {
                        data[i][j] = '-';
                    }
                }
            }
            setDefs(data);
        };
        oReq.send();
    }, [evalNumber]);

    const exportWordDoc = () => {
        const { file: xlFile, prefix } = getDefinitionFile(evalNumber);
        FileSaver.saveAs(xlFile, prefix + 'Definitions.xlsx');
    };

    return (<>
        <section className='tableHeader'>
            <h2>Definitions</h2>
            <button className='downloadBtn' onClick={exportWordDoc}>Download Definitions</button>
        </section>
        {defs && <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        <th>Variables</th>
                        {defs[0].slice(1).map((header) => (
                            <th key={'head_' + header}>{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {defs.slice(1).map((row, rind) => (
                        <tr key={'row_' + rind}>
                            <td key={`row_header_${rind}`}>{row[0]}</td>
                            {row.slice(1).map((cell, cind) => (
                                <td key={rind + '_' + cind}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
        }
    </>);
}


