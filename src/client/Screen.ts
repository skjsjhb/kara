/**
 * Scale window size based on screen size.
 */
export function scaleWindowSize(factor = 0.6) {
    const ew = screen.availWidth * factor;
    const eh = screen.availHeight * factor;
    const xs = window.innerWidth / ew;
    const ys = window.innerHeight / eh;
    // @ts-ignore
    window["_KARA_SCALE_SIZE_"](xs, ys);
}