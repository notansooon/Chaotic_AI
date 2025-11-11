import { parseTal } from "./t1_parser";



export const processLine = async (ndjsonLine: string, socket: any) => {

    const parsed = await parseTal(ndjsonLine);

}
