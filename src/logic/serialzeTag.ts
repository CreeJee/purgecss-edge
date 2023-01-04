
import { PurgeCSS } from "purgecss";
import { getByteSize } from "../lib/getByteSize.js";
import { httpGet } from "../lib/httpGet.js";
import { parseWithSelector, Element, ParentNode } from "../lib/parseWIthSelector.js";
interface LinkStructure {
    src: string,
    media: string,
}
interface LinkStructureWithIndex extends LinkStructure {
    index: number
}
interface StyleTagInfo {
    value: string,
}

const purgeCss = new PurgeCSS();
export const serializeTag = async (body: string) => {
    const $ = await parseWithSelector(body);
    const externalPipedTag = $("link, style");
    const linkTags: LinkStructureWithIndex[] = [];
    // css조합시 스타일링
    const styleInfoList: StyleTagInfo[] = []

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
                    };
                    isRemove = true;
                    break;
                default:
                    break;
            }
            if (isRemove) {
                $element.remove();
            }
        }
    }
    await Promise.allSettled(
        linkTags.map(v => {
            const positionMapper = (value: string) => {
                styleInfoList[v.index] = {
                    value,
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

    const beforeStyle = styleInfoList.reduce((accr, { value }) => accr + "\n" + value, "");
    console.log(`beforeSize = ${getByteSize(beforeStyle)}`);

    const purgedResult = await purgeCss.purge({
        fontFace: true,
        keyframes: true,
        content: [
            {
                extension: 'html',
                raw: body
            }
        ],
        css: [
            {
                raw: beforeStyle,
                name: "purgecss-generated"
            }
        ]
    })
    const mergedStyle = purgedResult[0].css
    console.log(`afterSize = ${getByteSize(mergedStyle)}`);
    const head = $("head");
    if (head) {
        head.append(`<style id="purge-css-generated">${mergedStyle}</style>`)
    }
    return $.html();
}