import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';


export function RQDefinitionTable({ xlFile, pdfFile, downloadName }) {
    const [defs, setDefs] = React.useState(null);

    React.useEffect(() => {
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
        FileSaver.saveAs(pdfFile ?? xlFile, downloadName);
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
                                return <td key={rind + '_' + cind}>{cell.split('\\n').map((p) => <p key={p}>{p}</p>)}</td>;
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


