import React, { useEffect, useState } from 'react';

const App = () => {
  const [num, setNum] = useState(1);

  const handleClick = () => {
    debugger;
    setNum(num + 1);
    setNum((n) => {
      return n + 3;
    });
  };

  return (
    <>
      <div key='title' id='title'>
        {num}
      </div>
      <button onClick={handleClick}>+ 1</button>
    </>
  );
};

export default App;
