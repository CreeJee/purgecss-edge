
import https from "https"
// Helper that turns https.request into a promise
export function httpGet(url: string) {
    if (url.startsWith("//")) {
        url = `https:${url}`;
    }
    return new Promise<string>((resolve, reject) => {
        const req = https.request(url.toString(), (res) => {
            const statusCode = res.statusCode ?? -1
            const location = res.headers.location;
            if (statusCode < 200 || statusCode >= 300) {
                switch (statusCode) {
                    case 301:
                    case 302:
                        if (location) {
                            const urlObject = new URL(url);
                            let redirectedLocation = location
                            if (redirectedLocation.startsWith("/")) {
                                redirectedLocation = `${urlObject.origin}${redirectedLocation}`
                            }
                            return resolve(httpGet(redirectedLocation))
                        }
                }
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