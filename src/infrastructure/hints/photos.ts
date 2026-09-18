import type { HintId } from "../../domain/hints";

type PhotoCredit = {
  author: string;
  license: string;
  source: string;
};

export type PhotoEntry = {
  src: `/hints/${string}.webp`;
  width: number;
  height: number;
  credit: PhotoCredit;
};

export const hintPhotos: Partial<Record<HintId, PhotoEntry>> = {
  "ask-around-ripples": {
    src: "/hints/ask-around-ripples.webp",
    width: 640,
    height: 853,
    credit: { author: "David Locke", license: "CC BY 2.0", source: "https://www.flickr.com/photos/7170162@N02/482773863" },
  },
  "back-up-layers": {
    src: "/hints/back-up-layers.webp",
    width: 640,
    height: 480,
    credit: { author: "IN 30 MINUTES Guides", license: "CC BY 2.0", source: "https://www.flickr.com/photos/17213139@N00/14138416141" },
  },
  "break-down-split": {
    src: "/hints/break-down-split.webp",
    width: 640,
    height: 432,
    credit: { author: "MSVG", license: "CC BY 2.0", source: "https://www.flickr.com/photos/13907834@N00/5021471720" },
  },
  "bring-back-orbit": {
    src: "/hints/bring-back-orbit.webp",
    width: 640,
    height: 848,
    credit: { author: "Smabs Sputzer", license: "CC BY 2.0", source: "https://www.flickr.com/photos/10413717@N08/5196415676" },
  },
  "call-off-cross": {
    src: "/hints/call-off-cross.webp",
    width: 575,
    height: 1023,
    credit: { author: "gruntzooki", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/37996580417@N01/3278313937" },
  },
  "carry-on-path": {
    src: "/hints/carry-on-path.webp",
    width: 640,
    height: 478,
    credit: { author: "MattHurst", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/22937701@N00/7275882420" },
  },
  "catch-up-steps": {
    src: "/hints/catch-up-steps.webp",
    width: 640,
    height: 429,
    credit: { author: "Peter Mooney", license: "CC BY 2.0", source: "https://www.flickr.com/photos/25874444@N00/14522259385" },
  },
  "check-in-gate": {
    src: "/hints/check-in-gate.webp",
    width: 640,
    height: 853,
    credit: { author: "jeremyfoo", license: "CC BY 2.0", source: "https://www.flickr.com/photos/73207483@N00/1968584537" },
  },
  "cheer-up-sun": {
    src: "/hints/cheer-up-sun.webp",
    width: 626,
    height: 1024,
    credit: { author: "profahrrad", license: "CC BY 2.0", source: "https://www.flickr.com/photos/58169009@N08/8650689687" },
  },
  "give-up-flag": {
    src: "/hints/give-up-flag.webp",
    width: 640,
    height: 962,
    credit: { author: "David Rosen", license: "CC BY 2.0", source: "https://www.flickr.com/photos/91492606@N07/8347676788" },
  },
  "get-along-bridge": {
    src: "/hints/get-along-bridge.webp",
    width: 500,
    height: 500,
    credit: { author: "Ahsan Saeed", license: "CC BY 2.0", source: "https://www.flickr.com/photos/27310159@N03/8404288423" },
  },
  "get-away-horizon": {
    src: "/hints/get-away-horizon.webp",
    width: 640,
    height: 491,
    credit: { author: "John-Morgan", license: "CC BY 2.0", source: "https://www.flickr.com/photos/24742305@N00/4896311628" },
  },
  "get-back-loop": {
    src: "/hints/get-back-loop.webp",
    width: 640,
    height: 498,
    credit: { author: "dbking", license: "CC BY 2.0", source: "https://www.flickr.com/photos/65193799@N00/3535957840" },
  },
  "get-over-arch": {
    src: "/hints/get-over-arch.webp",
    width: 640,
    height: 427,
    credit: { author: "Paolo Camera", license: "CC BY 2.0", source: "https://www.flickr.com/photos/81265351@N00/6798013028" },
  },
  "look-after-orbit": {
    src: "/hints/look-after-orbit.webp",
    width: 640,
    height: 334,
    credit: { author: "Gareth1953", license: "CC BY 2.0", source: "https://www.flickr.com/photos/40837632@N05/6108498889" },
  },
  "look-for-beacon": {
    src: "/hints/look-for-beacon.webp",
    width: 640,
    height: 896,
    credit: { author: "OnTask", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/22434330@N00/5521526969" },
  },
  "look-forward-arrow": {
    src: "/hints/look-forward-arrow.webp",
    width: 640,
    height: 384,
    credit: { author: "Georgia National Guard", license: "CC BY 2.0", source: "https://www.flickr.com/photos/40994485@N04/11897612274" },
  },
  "make-up-join": {
    src: "/hints/make-up-join.webp",
    width: 640,
    height: 935,
    credit: { author: "simpleinsomnia", license: "CC BY 2.0", source: "https://www.flickr.com/photos/95329455@N02/16915426190" },
  },
  "pick-up-rise": {
    src: "/hints/pick-up-rise.webp",
    width: 640,
    height: 427,
    credit: { author: "sunset_removals", license: "CC BY 2.0", source: "https://www.flickr.com/photos/128772241@N07/15579303145" },
  },
  "put-off-pause": {
    src: "/hints/put-off-pause.webp",
    width: 640,
    height: 853,
    credit: { author: "gruntzooki", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/37996580417@N01/5309672184" },
  },
};
