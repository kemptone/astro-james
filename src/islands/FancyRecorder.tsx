import { useEffect, useState } from "preact/hooks";

export default (props: {}) => {
  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (e) => {
      });
    });
  }

  return (
    <div>
    </div>
  );
};
