
import https from "https"
// Helper that turns https.request into a promise
export function httpGet(options: string) {
    return new Promise<string>((resolve, reject) => {
        const req = https.request(options, (res) => {
            const statusCode = res.statusCode ?? -1
            if (statusCode < 200 || statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            const buffer: Uint8Array[] = [];
            let body = '';
            res.on('data', function (chunk) {
                buffer.push(chunk);
            });
            res.on('end', function () {
                try {
                    body = Buffer.concat(buffer).toString('utf-8');
                    // body = JSON.parse(Buffer.concat(body).toString());
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        const onAborted = (e: Error) => {
            reject(e.message);
        }
        req.on('error', onAborted);
        req.on('timeout', () => onAborted(new Error('timeout')))

        req.end();
    });
}