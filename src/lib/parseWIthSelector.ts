
import { load } from "cheerio"

export type { Node, AnyNode, ParentNode, Element, Document } from 'cheerio';
export const parseWithSelector = (body: string) => load(body)