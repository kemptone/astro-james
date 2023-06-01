import { useEffect, useState } from "preact/hooks";
import RecordingItem from "../components/RecordingItem.tsx";
import recorderHooks from "../hooks/recorderHooks.tsx";

const AudioRecorder = ({
  setAsSound,
  setAsSound2,
}: {
  setAsSound: (str: string) => void;
  setAsSound2: (str: string) => void;
}) => {
  const {
    startRecording,
    setRecordings,
    recordings,
    isRecording,
    stopRecording,
    audioURLs,
    deleteRecording,
  } = recorderHooks();

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <div className="recording-items">
        {recordings.map(({ audioURL, timestamp, id }, index) => (
          <RecordingItem
            {...{
              audioURL,
              timestamp,
              deleteRecording,
              id,
              setAsSound,
              setAsSound2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioRecorder;
