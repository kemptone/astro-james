import { MutableRef, useEffect, useRef } from "preact/hooks";

function removeYoutubeLink(url: string) {
  let id;

  if (url.indexOf("embed/") !== -1) {
    id = url.split("embed/")[1].split("?")[0];
  } else {
    id = url.split("v=")[1];
  }

  const ampersandPosition = id.indexOf("&");
  if (ampersandPosition !== -1) {
    return id.substring(0, ampersandPosition);
  }
  return id;
}

const CAMS: string[] = [];

function add(url: string) {
  CAMS.push(removeYoutubeLink(url));
}

add("https://www.youtube.com/embed/EgIZ7abXpUE?autoplay=1&mute=1");
// add("https://www.youtube.com/embed/1HuXun1vURc?autoplay=1&mute=1");
// add("https://www.youtube.com/embed/mLhR80JlLY8?autoplay=1&mute=1");
// add("https://www.youtube.com/watch?v=2uabwdYMzVk");
// add("https://www.youtube.com/watch?v=1-iS7LArMPA");
// add("https://www.youtube.com/watch?v=pXe8MpU7uzk");
// add("https://www.youtube.com/watch?v=gcDWT-mTCOI");
// add("https://www.youtube.com/watch?v=-HxJYZI9AMk");
// add("https://www.youtube.com/watch?v=1lPnLBUIlko");

export default () => {
  const e_players: MutableRef<HTMLDivElement | null>[] = [];
  CAMS.forEach((cam, index, arr) => {
    e_players.push(useRef<HTMLDivElement | null>(null));
  });

  useEffect(() => {
    if (typeof window === "undefined" || e_players[0].current === null) {
      return;
    }

    const players: any[] = [];

    const FACTOR = 0.8;

    const origin = window.location.origin;

    // debugger;

    window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
      CAMS.forEach((cam, index, arr) => {
        players.push(
          new YT.Player(e_players[index].current, {
            height: String(390 * FACTOR),
            width: String(640 * FACTOR),
            videoId: CAMS[index],
            playerVars: {
              "playsinline": 1,
              "controls": 0,
              "enablejsapi": 1,
              "modestbranding": 1,
              "color": "white",
              "iv_load_policy": 3,
              "rel": 0,
              // "origin": origin,
            },
            events: {
              "onReady": onPlayerReady(index),
              "onStateChange": onPlayerStateChange(index),
            },
          }),
        );
      });

      //   player = new YT.Player(e_player.current, {
      //     height: "390",
      //     width: "640",
      //     videoId: CAMS[0],
      //     playerVars: {
      //       "playsinline": 1,
      //       "controls": 0,
      //       "enablejsapi": 1,
      //       "modestbranding": 1,
      //       "color": "white",
      //       "iv_load_policy": 3,
      //     },
      //     events: {
      //       "onReady": onPlayerReady,
      //       "onStateChange": onPlayerStateChange,
      //     },
      //   });
    };

    // Control the video player using JavaScript
    const onPlayerReady = (index) => (event) => {
      // You can control the video player here
      players[index].playVideo();
      //   player.playVideo();
    };

    const onPlayerStateChange = (index) => (event) => {
      //   debugger;
      // You can listen to the video player state changes here
    };
  }, []);

  return (
    <div className="live-cams">
      {CAMS.map((cam, index) => {
        return <div ref={e_players[index]}></div>;
      })}
      {/* <div ref={e_players[0]}></div> */}
      {/* <div ref={e_players[1]}></div> */}
      {/* <div ref={e_players[2]}></div> */}
    </div>
  );
};
