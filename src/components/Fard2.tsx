import React, { useState } from "react";

export default () => {
  const [] = useState(0);

  return (
    <div className="
        bg-red-500 c-yellow-400
        hover:(bg-blue-500 c-yellow-100)
        md:(bg-green-500 c-yellow-700)
        lg:(bg-green-800 c-yellow-300)
      ">
      Fardo the lop
    </div>
  );
};
