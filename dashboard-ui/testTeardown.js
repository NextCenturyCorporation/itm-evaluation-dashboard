import { exec } from 'child_process';

module.exports = async () => {
    exec('npm run stop:test', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping server: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`Server stopped: ${stdout}`);
    });
};