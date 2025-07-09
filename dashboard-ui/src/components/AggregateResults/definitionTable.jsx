import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import mreXlFile from './Variable Definitions/MRE_Variables.xlsx';
import dreXlFile from './Variable Definitions/DRE_Variables.xlsx';
import ph1XlFile from './Variable Definitions/PH1_Variables.xlsx'
import ph2XlFile from './Variable Definitions/PH2_Variables.xlsx'

export function DefinitionTable({ evalNumber }) {
    console.log(evalNumber)
    const [defs, setDefs] = React.useState(null);

    React.useEffect(() => {
        const xlFile = evalNumber >= 8 ? ph2XlFile : evalNumber == 4 ? dreXlFile : evalNumber == 5 ? ph1XlFile : mreXlFile;
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
    }, []);

    const exportWordDoc = () => {
        const xlFile = evalNumber >= 8 ? ph2XlFile : evalNumber == 4 ? dreXlFile : evalNumber == 5 ? ph1XlFile : mreXlFile;
        FileSaver.saveAs(xlFile, (evalNumber == 3 ? 'mre_' : evalNumber == 4 ? 'dre_' : evalNumber == 5 ? 'ph1_' : 'ph2_') + 'Definitions.xlsx');
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


