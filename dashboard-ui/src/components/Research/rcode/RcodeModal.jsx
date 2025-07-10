import React from "react";
import * as FileSaver from 'file-saver';

export function RCodeModal({ rcodeFile, downloadName }) {
    const [txt, setTxt] = React.useState(null);

    React.useEffect(() => {
        const oReq = new XMLHttpRequest();
        oReq.open("GET", rcodeFile, true);

        oReq.onload = function () {
            const resp = oReq.responseText.replaceAll('\n', '\\n');
            const tmpTxt = [];
            resp.split('\\n').forEach((x) => {
                tmpTxt.push(x);
            });
            setTxt(tmpTxt);
        };
        oReq.send();
    }, [rcodeFile]);

    const exportRCode = () => {
        FileSaver.saveAs(rcodeFile, downloadName);
    };

    return (<>
        <button className='downloadBtn codeDownload' onClick={exportRCode}>Download Code</button>
        {txt && <div className='rCode'>
            {txt.map((x, ind) => x === '' ? <br key={'br' + ind} /> : <p key={x + ind} className='code-line'>{x}</p>)}
        </div>
        }
    </>);
}


