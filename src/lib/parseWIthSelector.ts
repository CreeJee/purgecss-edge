import { fromParse5 } from "hast-util-from-parse5/index.js"
import { parse } from "parse5"
import { fromHtml } from "hast-util-from-html"

export type Parent = import('hast').Parent
export type Element = import('hast').Element
export type Root = import('hast').Root
export type Text = import('hast').Text
export type Comment = import('hast').Comment
export type Doctype = import('hast').DocType
export type Child = Parent['children'][number]
export type ElementChild = Element['children'][number]
export type Node = Child | Root

export const parseWithSelector = async (body: string) => {
    return new Promise<Node>((resolve) => {
        resolve(fromHtml(body, {}))
    })
}