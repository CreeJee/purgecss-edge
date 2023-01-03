import { serializeTag } from "../logic/serialzeTag.js"
import fs from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url";

const localDirName = dirname(fileURLToPath(import.meta.url));
const targetDir = resolve(localDirName, './testTag.html');
serializeTag(fs.readFileSync(targetDir).toString('utf-8'))