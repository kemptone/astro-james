import { ClassAttributes, Component, h } from "preact";
import { MutableRef } from "preact/hooks";

interface DraggableProps {
  positionX: number;
  positionY: number;
  children: h.JSX.Element;
  onMove: (newX: number, newY: number) => void;
  wrapRef?: ClassAttributes<HTMLDivElement>["ref"];
}

interface DraggableState {
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  positionX: number;
  positionY: number;
}

class Draggable extends Component<DraggableProps, DraggableState> {
  constructor(props: DraggableProps) {
    super(props);

    this.state = {
      isDragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      positionX: props.positionX || 0,
      positionY: props.positionY || 0,
    };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  componentDidUpdate(
    previousProps: Readonly<DraggableProps>,
    previousState: Readonly<DraggableState>,
    snapshot: any,
  ): void {
    if (
      previousProps.positionX !== this.props.positionX ||
      previousProps.positionY !== this.props.positionY
    ) {
      this.setState({
        positionX: this.props.positionX,
        positionY: this.props.positionY,
      });
    }
  }

  handleMouseDown(event: MouseEvent) {
    event.preventDefault();

    this.setState({
      isDragging: true,
      dragOffsetX: event.clientX - this.state.positionX,
      dragOffsetY: event.clientY - this.state.positionY,
    });

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.state.isDragging) {
      return;
    }

    const positionX = event.clientX - this.state.dragOffsetX;
    const positionY = event.clientY - this.state.dragOffsetY;

    this.setState({
      positionX,
      positionY,
    });

    this.props.onMove(positionX, positionY);
  }

  handleMouseUp() {
    this.setState({
      isDragging: false,
    });

    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleTouchStart(event: TouchEvent) {
    event.preventDefault();

    const touch = event.touches[0];

    this.setState({
      isDragging: true,
      dragOffsetX: touch.clientX - this.state.positionX,
      dragOffsetY: touch.clientY - this.state.positionY,
    });

    document.addEventListener("touchmove", this.handleTouchMove);
    document.addEventListener("touchend", this.handleTouchEnd);
  }

  handleTouchMove(event: TouchEvent) {
    if (!this.state.isDragging) {
      return;
    }

    const touch = event.touches[0];
    const positionX = touch.clientX - this.state.dragOffsetX;
    const positionY = touch.clientY - this.state.dragOffsetY;

    this.setState({
      positionX,
      positionY,
    });

    this.props.onMove(positionX, positionY);
  }

  handleTouchEnd() {
    this.setState({
      isDragging: false,
    });

    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
  }

  render() {
    const { children, wrapRef } = this.props;
    const { positionX, positionY } = this.state;

    return (
      <div
        style={{ position: "absolute", left: positionX, top: positionY }}
        onMouseDown={this.handleMouseDown}
        onTouchStart={this.handleTouchStart}
        ref={wrapRef}
      >
        {children}
      </div>
    );
  }
}

export default Draggable;
