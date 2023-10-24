/*
 * @Descripttion:
 * @version:
 * @Author: 阿鸿
 * @Date: 2023-07-30 22:23:01
 * @LastEditors: 阿鸿
 * @LastEditTime: 2023-07-30 22:35:17
 */
import { REACT_ELEMENT_TYPE } from './ReactSymbols';

const RESOLVED_PROPS = {
  ref: true,
  key: true,
  __self: true,
  __source: true,
};
export function createElement(type, config, children) {
  let propName;
  const props = {};
  let ref = null;
  let key = null;
  if (config) {
    if (config.ref) {
      ref = config.ref;
    }
    if (config.key) {
      key = config.key;
    }
    for (propName in config) {
      if (!RESOLVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
}
