// import { Draggable } from "https://esm.sh/preact-draggable";
import Draggable from "https://esm.sh/react-draggable";
import { useRef, useState } from "preact/hooks";

// import Draggable from "npm:react-draggable";
// import { AiFillCloseCircle } from "react-icons/ai";

type XY = {
  pos1: number;
  pos2: number;
  pos3: number;
  pos4: number;
};

export default function (props: {
  color: string;
  symbol: string;
  onDelete: () => void;
  onMove: (newX: number, newY: number) => void;
  x: number;
  y: number;
}) {
  const { color, symbol, onDelete, onMove } = props;
  const [x, setX] = useState(props.x);
  const [y, setY] = useState(props.y);

  const handleDrag = (e: DragEvent) => {
    const XX = e.clientX - x;
    const YY = e.clientY - y;
    setX(XX);
    setY(YY);
    console.log({ XX, YY });
  };

  return (
    <div
      style={{
        backgroundColor: color,
        color: color === "#000" ? "#fff" : "#000",
        cursor: "move",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "80px",
        height: "80px",
        borderRadius: "10px",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.25)",
        marginRight: "20px",
        position: "fixed",
        top: `${props.y}px`,
        left: `${props.x}px`,
      }}
      // draggable="true"
      draggable
      // onDragStart={handleDrag}
      // onDragOver={handleDrag}
      // onDragLeave={handleDrag}
      onDrag={handleDrag}
      className="draggable-audio-box"
    >
      {symbol}
    </div>
  );
}
