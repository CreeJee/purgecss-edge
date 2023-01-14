
import { performance } from 'perf_hooks'
export const performanceLogger = <T>(logging: string) => {
    const start = performance.now();
    console.log(`before-${logging}`)
    return () => {
        console.log(`after-${logging}`, performance.now() - start);
    }
}