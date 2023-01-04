import { serializeTag } from "../logic/serialzeTag.js"
import fs from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url";
const init = async () => {

    const localDirName = dirname(fileURLToPath(import.meta.url));
    const readHTMLPath = resolve(localDirName, './testTag.html');
    const writeHTMLPath = resolve(localDirName, './outTag.html');
    const data = await serializeTag(fs.readFileSync(readHTMLPath).toString('utf-8'))
    fs.writeFileSync(writeHTMLPath, data);
}
init()