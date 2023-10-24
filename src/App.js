import React, { useState } from 'react';

const App = () => {
  const [num, setNum] = useState(1);
  const handleClick = () => {
    debugger;
    setNum((a) => {
      return a + 1;
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
