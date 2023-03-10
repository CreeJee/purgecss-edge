
import { PurgeCSS } from "purgecss";
import { getByteSize } from "../lib/getByteSize.js";
import { httpGet } from "../lib/httpGet.js";
import { parseWithSelector, Element } from "../lib/parseWIthSelector.js";
import { transform as cssTransform } from "lightningcss"
import { resolve } from "path";
import { baseDir } from "../config.js";
import { toUtf8Buffer } from "../lib/toBuffer.js";
import { performanceLogger } from "../lib/logger.js";
import { CheerioAPI } from "cheerio";
import { jsTransformSync } from "../lib/transform/jsTransform.js";



interface ExternalTagStructure {
    src: string,
    index: number
}
interface CssStructure extends ExternalTagStructure {
    media: string,
}
interface JsStructure extends ExternalTagStructure {

}
interface TagInfo {
    value: string,
    path: string
}
const textCompositor = (listRef: TagInfo[]) => {
    return listRef.reduce((accr, { value, path }) => accr + `\n/** [path:${path}]*/` + value, "");
}
const scriptCompositor = (listRef: TagInfo[]) => {
    return listRef.reduce((accr, { value, path }) => accr + `\n<script data-original-path="${jsTransformSync(path)}">${value}</script>`, "");
}
const toMergeContent = async <T>(
    tagStructures: ExternalTagStructure[],
    listRef: TagInfo[],
    compositor: (listRef: TagInfo[]) => T
) => {
    await Promise.allSettled(
        tagStructures.map(v => {
            const positionMapper = (value: string) => {
                listRef[v.index] = {
                    value,
                    path: v.src
                }
            }
            return httpGet(v.src).then(
                positionMapper,
                () => positionMapper('')
            ).catch(
                () => positionMapper('')
            )
        })
    )
    return compositor(listRef);
}
const purgeCss = new PurgeCSS();

const gatheringResource = ($doc: CheerioAPI) => {

}

const testFileDir = resolve(baseDir, './test.css');
export const serializeTag = async (body: string) => {
    const $ = await parseWithSelector(body);
    const externalPipedTag = $("link[rel='stylesheet'], style, script");
    const linkTags: CssStructure[] = [];
    const scriptTags: JsStructure[] = [];
    // css????????? ????????????
    const styleInfoList: TagInfo[] = []
    const scriptInfoList: TagInfo[] = []

    for (let index = 0; index < externalPipedTag.length; index++) {
        const element = externalPipedTag.get(index);
        const $element = externalPipedTag.eq(index);
        let isRemove = false;
        if (element) {
            const prop = element?.attribs;
            switch (element?.tagName) {
                case "link":
                    if (prop.rel === 'stylesheet') {
                        const src = (typeof prop.href === 'string' ? prop.href : "");
                        const media = (typeof prop.media === 'string' ? prop.media : "");
                        linkTags.push({
                            src,
                            media,
                            index,
                        });
                        isRemove = true;
                    }
                    break;
                case "style":
                    const text = $element.text()
                    styleInfoList[index] = {
                        value: text,
                        path: `[initial / ${index}]`
                    };
                    isRemove = true;
                    break;
                case "script":
                    const src = $element.prop("src");
                    const type = prop.type;
                    if (type === "text/javascript" || !type) {
                        if (typeof src === "string" && src.length > 0) {
                            scriptTags.push({
                                index,
                                src
                            })
                        } else {
                            scriptInfoList[index] = {
                                value: $element.text(),
                                path: `[initial / ${index}]`
                            }
                        }
                        isRemove = true;
                    }
                    break;
                default:
                    break;
            }
            if (isRemove) {
                $element.remove();
            }
        }
    }
    const afterRequest = performanceLogger('request')
    const [beforeStyle, preProcessedScript] = await Promise.all([
        toMergeContent(linkTags, styleInfoList, textCompositor),
        toMergeContent(scriptTags, scriptInfoList, scriptCompositor)
    ]);
    afterRequest();
    const $preProcessedJS = $(preProcessedScript)
    $('body').append($preProcessedJS);
    // console.log(`beforeSize = ${getByteSize(beforeStyle)}`);

    const rawMergedHTML = $.html();
    const afterPurge = performanceLogger('purge')
    const purgedResult = await purgeCss.purge({
        fontFace: true,
        keyframes: true,
        content: [
            {
                extension: 'html',
                raw: rawMergedHTML
            }
        ],
        css: [
            {
                raw: beforeStyle,
                name: "purgecss-generated"
            }
        ]
    })
    afterPurge();
    const purgedStyle = purgedResult[0].css;
    // console.log(`afterPurge = ${getByteSize(purgedStyle)}`)
    const { code: minifiedStyle } = cssTransform({
        code: toUtf8Buffer(purgedStyle),
        filename: 'foo',
        minify: true,
    })
    const mergedStyle = minifiedStyle.toString('utf-8');
    // console.log(`afterMinify = ${getByteSize(mergedStyle)}`);
    const head = $("head");
    if (head) {
        head.append(`<style id="purge-css-generated">${mergedStyle}</style>`)
    }
    $preProcessedJS.remove();
    return $.html();
}