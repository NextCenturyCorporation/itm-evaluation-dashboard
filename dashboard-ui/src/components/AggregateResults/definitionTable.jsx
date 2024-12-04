import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import mreXlFile from './MRE_Variables.xlsx';
import mreWordFile from './MRE_Human_Dataset_Variables_Dashboard.docx';
import dreXlFile from './DRE_Variables.xlsx';
import dreWordFile from './DRE_Human_Dataset_Variables_Dashboard.docx';

export function DefinitionTable({ evalNumber }) {
    const [defs, setDefs] = React.useState(null);

    React.useEffect(() => {
        const xlFile = evalNumber == 4 || evalNumber == 5 ? dreXlFile : mreXlFile; 
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
        const wordFile = evalNumber == 4 ? dreWordFile : mreWordFile;
        FileSaver.saveAs(wordFile, (evalNumber == 3 ? 'mre_' : evalNumber == 4 ? 'dre_' : 'ph1_') + 'Definitions.docx');
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
                        {defs[0].map((header) => {
                            return <th key={'head_' + header}>{header}</th>
                        })}
                    </tr>
                </thead>

                <tbody>
                    {defs.slice(1).map((row, rind) => {
                        return <tr key={'row_' + rind}>{
                            row.map((cell, cind) => {
                                return <td key={rind + '_' + cind}>{cell}</td>;
                            })
                        }
                        </tr>;
                    })}
                </tbody>

            </table>
        </div>
        }
    </>);
}


