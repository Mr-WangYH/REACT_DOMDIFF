import { createElement, diffProperties, setInitialProperties } from './ReactDOMComponent';

// 如果儿子只是一个数字或者字符串，就设置它的文本内容就行了，不需要创建子fiber节点
export function shouldSetTextContent(type, pendingProps) {
  return typeof pendingProps.childre === 'string' || typeof pendingProps.childre === 'number';
}

export function createInstance(type) {
  return createElement(type);
}

export function finalizeInitialChildren(domElment, type, props) {
  setInitialProperties(domElment, type, props);
}

// 真实的dom操作
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}

export function insertBefore(parentInstance, child, before) {
  parentInstance.insertBefore(child, before);
}

export function prepareUpdate(element, type, oldProps, newProps) {
  return diffProperties(element, type, oldProps, newProps);
}

export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}
