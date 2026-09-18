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
    height: 427,
    credit: { author: "Amos777eligius", license: "CC BY 4.0", source: "https://commons.wikimedia.org/w/index.php?curid=64770213" },
  },
  "back-up-layers": {
    src: "/hints/back-up-layers.webp",
    width: 640,
    height: 423,
    credit: { author: "Bernard Spragg", license: "CC0 1.0", source: "https://www.flickr.com/photos/88123769@N02/15820921483" },
  },
  "break-down-split": {
    src: "/hints/break-down-split.webp",
    width: 640,
    height: 480,
    credit: { author: "dlz design", license: "CC BY 2.0", source: "https://www.flickr.com/photos/32912201@N07/3709154957" },
  },
  "bring-back-orbit": {
    src: "/hints/bring-back-orbit.webp",
    width: 640,
    height: 424,
    credit: { author: "www.TonyHeywardImages.com.au", license: "CC BY 2.0", source: "https://www.flickr.com/photos/99814046@N04/9433488095" },
  },
  "call-off-cross": {
    src: "/hints/call-off-cross.webp",
    width: 640,
    height: 428,
    credit: { author: "Wikimania2009", license: "CC BY 2.0", source: "https://www.flickr.com/photos/41749772@N06/3857732258" },
  },
  "carry-on-path": {
    src: "/hints/carry-on-path.webp",
    width: 640,
    height: 479,
    credit: { author: "s9-4pr", license: "CC BY 2.0", source: "https://www.flickr.com/photos/119983612@N04/17586692820" },
  },
  "catch-up-steps": {
    src: "/hints/catch-up-steps.webp",
    width: 640,
    height: 427,
    credit: { author: "comedy_nose", license: "Dominio publico", source: "https://www.flickr.com/photos/23408922@N07/9320845849" },
  },
  "check-in-gate": {
    src: "/hints/check-in-gate.webp",
    width: 640,
    height: 427,
    credit: { author: "Lenny K Photography", license: "CC BY 2.0", source: "https://www.flickr.com/photos/57527070@N06/20302642103" },
  },
  "cheer-up-sun": {
    src: "/hints/cheer-up-sun.webp",
    width: 640,
    height: 480,
    credit: { author: "Nicholas_T", license: "CC BY 2.0", source: "https://www.flickr.com/photos/14922165@N00/281820290" },
  },
  "give-up-flag": {
    src: "/hints/give-up-flag.webp",
    width: 640,
    height: 958,
    credit: { author: "cclogg", license: "CC0 1.0", source: "https://www.flickr.com/photos/46244586@N02/16859092313" },
  },
  "get-along-bridge": {
    src: "/hints/get-along-bridge.webp",
    width: 640,
    height: 481,
    credit: { author: "Revolweb", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/38671911@N08/23489015593" },
  },
  "get-away-horizon": {
    src: "/hints/get-away-horizon.webp",
    width: 640,
    height: 853,
    credit: { author: "The Wandering Angel", license: "CC BY 2.0", source: "https://www.flickr.com/photos/86518301@N00/2796305576" },
  },
  "get-back-loop": {
    src: "/hints/get-back-loop.webp",
    width: 640,
    height: 480,
    credit: { author: "chad_k", license: "CC BY 2.0", source: "https://www.flickr.com/photos/99535234@N00/3674574542" },
  },
  "get-over-arch": {
    src: "/hints/get-over-arch.webp",
    width: 640,
    height: 426,
    credit: { author: "a4gpa", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/94833286@N00/195354385" },
  },
  "look-for-beacon": {
    src: "/hints/look-for-beacon.webp",
    width: 640,
    height: 964,
    credit: { author: "Kenneth Moore Photography", license: "CC BY 2.0", source: "https://www.flickr.com/photos/50276595@N03/8486376375" },
  },
  "look-forward-arrow": {
    src: "/hints/look-forward-arrow.webp",
    width: 640,
    height: 960,
    credit: { author: "Eric Lim Photography", license: "CC BY 2.0", source: "https://www.flickr.com/photos/27721740@N04/3422930676" },
  },
  "make-up-join": {
    src: "/hints/make-up-join.webp",
    width: 640,
    height: 480,
    credit: { author: "Moiseiko", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/w/index.php?curid=10720352" },
  },
  "pick-up-rise": {
    src: "/hints/pick-up-rise.webp",
    width: 640,
    height: 964,
    credit: { author: "Mark Fischer", license: "CC BY-SA 2.0", source: "https://www.flickr.com/photos/80854685@N08/7454618344" },
  },
  "put-off-pause": {
    src: "/hints/put-off-pause.webp",
    width: 640,
    height: 426,
    credit: { author: "gingertammycat", license: "CC BY 2.0", source: "https://www.flickr.com/photos/99027078@N00/350673406" },
  },
};
