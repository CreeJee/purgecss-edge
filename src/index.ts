// import type { CloudFrontResponseHandler } from "aws-lambda";
// import { matches, select, selectAll } from 'hast-util-select'
// import { requestEdge } from "./lib/requestEdge.js";

// export const handler: CloudFrontResponseHandler = async (
//     event,
//     context,
//     callback
// ) => {
//     context.callbackWaitsForEmptyEventLoop = false;
//     const records = event.Records;
//     if (records && records.length > 0) {
//         const request = records[0].cf.request;
//         const body = await requestEdge(request);


//     }
// };
