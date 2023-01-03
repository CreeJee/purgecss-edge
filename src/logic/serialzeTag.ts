import { selectAll } from "hast-util-select/index.js";
import { text } from "stream/consumers";
import { httpGet } from "../lib/httpGet.js";
import { parseWithSelector, Element, Text, Node } from "../lib/parseWIthSelector.js";

interface LinkStructure {
    element: Element,
    src: string,
    media: string,
}
interface LinkStructureWithIndex extends LinkStructure {
    index: number
}
interface StyleTagInfo {
    value: string,
    node: Node
    parent: Node
}

const stringSplice = function (self: string, index: number, count: number,) {
    if (index < 0) {
        index += self.length;
        if (index < 0)
            index = 0;
    }
    return self.slice(0, index) + self.slice(index + count);
}
export const serializeTag = async (body: string) => {
    const document = await parseWithSelector(body);
    const externalPipedTag = selectAll("link, style", document);
    const linkTags: LinkStructureWithIndex[] = [];
    // css조합시 스타일링
    const styleInfoList: StyleTagInfo[] = []

    for (let index = 0; index < externalPipedTag.length; index++) {
        const element = externalPipedTag[index];
        const prop = element.properties ?? {};
        switch (element.tagName) {
            case "link":
                if (Array.isArray(prop.rel) && prop.rel.includes('stylesheet')) {
                    const src = (typeof prop.href === 'string' ? prop.href : "");
                    const media = (typeof prop.media === 'string' ? prop.media : "");
                    console.log(element);
                    linkTags.push({
                        element,
                        src,
                        media,
                        index,
                    });
                }
                break;
            case "style":
                const textNode = element.children[0] as Text
                if (textNode.position) {
                    styleInfoList[index] = {
                        value: textNode.value,
                        node: textNode,
                        parent: element
                    };
                }
                break;
            default:
                break;
        }
    }
    await Promise.allSettled(
        linkTags.map(v => {
            const positionMapper = (value: string) => {
                styleInfoList[v.index] = {
                    value,
                    node: v.element,
                    parent: v.element
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
    const composedText = styleInfoList.reduce((accr, v) => v.value + accr, "");
    const beforeSize = new TextEncoder().encode(composedText).length;
    console.log(`beforeSize = ${beforeSize}`);


    //TODO: 생성된 스타일들을 노드 단위에서 기존노드 제거후 purged된 컨탠츠와 함께 비교
    for (let index = 0; index < styleInfoList.length; index++) {
        const data = styleInfoList[index];
        if (data) {
            const { node, value } = data
            const pos = node.position;
            if (pos) {
                const start = pos.start.offset ?? 0;
                const end = pos.end.offset ? pos.end.offset - start : start;
                console.log(start, end)
                body = stringSplice(body, start, end)
            }
        }
    }
}