import React from 'react';
// import ReactDOM from 'react-dom';
import ReactDOM from 'react-dom/client';
import App from './App';

let element = <App></App>;
// let element = (
//   <div key='title' id='title'>
//     title
//   </div>
// );
// react 17
// ReactDOM.render(element, document.getElementById('root'));

// react 18
ReactDOM.createRoot(document.getElementById('root')).render(element);
