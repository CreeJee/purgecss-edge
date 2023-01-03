import { CloudFrontRequest } from "aws-lambda";
import { httpGet } from "./httpGet";

export const requestEdge = (request: CloudFrontRequest) => {
    const host = request['headers']['host'][0]['value']; // xxxx.yyy.com
    const uri = request['uri'];
    const fetchOriginalBodyUrl = 'https://' + host + uri;

    return httpGet(fetchOriginalBodyUrl);
}
