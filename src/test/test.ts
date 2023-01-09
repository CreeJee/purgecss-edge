import { serializeTag } from "../logic/serialzeTag.js"
import fs from "fs"
import { resolve } from "path"
import { baseDir } from "../config.js";
const init = async () => {
    const readHTMLPath = resolve(baseDir, './test/testTag.html');
    const writeHTMLPath = resolve(baseDir, './test/outTag.html');
    const data = await serializeTag(fs.readFileSync(readHTMLPath).toString('utf-8'))
    fs.writeFileSync(writeHTMLPath, data);
}
init()