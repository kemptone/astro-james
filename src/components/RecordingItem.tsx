import preact from "preact";

const RecordingItem: preact.FunctionalComponent<{
  audioURL: string;
  timestamp: number;
  setAsSound: (audioURL: string) => void;
  setAsSound2: (audioURL: string) => void;
  deleteRecording: (timestamp: number) => void;
  id: number;
}> = (props) => {
  return (
    <div className="recording-item">
      <audio
        src={props.audioURL}
        controls
      />
      <button
        onClick={() => props.setAsSound(props.audioURL)}
        children="✔"
        className="icon"
      />
      <button
        onClick={() => props.setAsSound2(props.audioURL)}
        children="✔"
        className="icon"
      />
      <button
        onClick={() => props.deleteRecording(props.id)}
        children="✕"
        className="icon"
      />
    </div>
  );
};

export default RecordingItem;
