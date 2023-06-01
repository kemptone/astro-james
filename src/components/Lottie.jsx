export default (args) => {
  const {
    src = "",
    background = "transparent",
    speed = "1",
    style = "width: 300px; height: 300px",
    loop,
    controls,
    autoplay,
  } = args;

  return (
    <>
      {/* <lottie-player { ...{ src, background, speed, style, loop, controls, autoplay }}></lottie-player> */}
      <lottie-player
        src="https://assets5.lottiefiles.com/datafiles/zc3XRzudyWE36ZBJr7PIkkqq0PFIrIBgp4ojqShI/newAnimation.json"
        background="transparent"
        speed="1"
        style="width: 300px; height: 300px;"
        loop
        controls
        autoplay
      >
      </lottie-player>
    </>
  );
};
