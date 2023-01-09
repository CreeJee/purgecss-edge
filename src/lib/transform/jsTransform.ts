
import {
    transform as swcTransform,
    transformSync as swcTransformSync,
    Options
} from "@swc/core"
const swcOptions: Options = {
    minify: true,
    inputSourceMap: true,
    jsc: {
        minify: {
            compress: true,
        },
        keepClassNames: true,
        loose: true,
    }
}
export const jsTransform = async (code: string) => {
    const data = await swcTransform(code, swcOptions)
    return data.code;
}

export const jsTransformSync = (code: string) => {
    const data = swcTransformSync(code, swcOptions)
    return data.code;
}