import { useCallback, useRef, useState } from "preact/hooks";
// import { AiFillCloseCircle } from "react-icons/ai";

type XY = {
  pos1: number;
  pos2: number;
  pos3: number;
  pos4: number;
};

export function AudioBox(props: {
  color: string;
  symbol: string;
  onDelete: () => void;
  onMove: (newX: number, newY: number) => void;
  x: number;
  y: number;
}) {
  const { color, symbol, onDelete, onMove } = props;
  const xy = useRef<XY>({ pos1: props.x, pos2: props.y, pos3: 0, pos4: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const dragMouseDown = useCallback(function dragMouseDown(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    xy.current.pos3 = e.clientX;
    // pos3 = e.clientX;
    xy.current.pos4 = e.clientY;
    // pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves: ??
    document.onmousemove = elementDrag;
  }, []);

  const elementDrag = useCallback(function elementDrag(e: DragEvent) {
    e = e || window.event;
    e.preventDefault();

    // const elmnt = e.currentTarget as HTMLElement;

    // calculate the new cursor position:
    const pos1 = xy.current.pos1 = xy.current.pos3 - e.clientX;
    const pos2 = xy.current.pos2 = xy.current.pos4 - e.clientY;
    // set the element's new position:
    xy.current.pos3 = e.clientX;
    xy.current.pos4 = e.clientY;
    if (elementRef.current === null) return;

    const top = elementRef.current.offsetTop - pos2;
    const left = elementRef.current.offsetLeft - pos1;

    onMove(left, top);

    elementRef.current.style.top = top + "px";
    elementRef.current.style.left = left + "px";
  }, []);

  const closeDragElement = useCallback(function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }, []);

  // function handleDeleteClick() {
  //   onDelete();
  // }

  return (
    <div
      ref={elementRef}
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
      className="draggable-audio-box"
      draggable={true}
      onMouseDown={dragMouseDown}
      onTouchStart={dragMouseDown}
      onTouchMove={dragMouseDown}
      onTouchEnd={dragMouseDown}
    >
      <div style={{ fontSize: "30px" }}>{symbol}</div>
      {/* <AiFillCloseCircle /> */}
    </div>
  );
}
