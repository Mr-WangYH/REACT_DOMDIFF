export function createElement(type) {
  return document.createElement(type);
}

export function setInitialProperties(domElment, type, props) {
  for (const propKey in props) {
    const nextProps = props[propKey];
    if (propKey === 'children') {
      if (typeof nextProps === 'string' || typeof nextProps === 'number') {
        domElment.textContent = nextProps;
      }
    } else if (propKey === 'style') {
      for (let stylePropKey in nextProps) {
        domElment.style[stylePropKey] = nextProps[stylePropKey];
      }
    } else {
      domElment[propKey] = nextProps;
    }
  }
}

export function diffProperties(element, type, lastProps, nextProps) {
  let updatePayload = null;
  let propKey;
  for (propKey in lastProps) {
    if (lastProps.hasOwnProperty(propKey) && !nextProps.hasOwnProperty(propKey)) {
      // updatePayload更新数组[更新的key1，更新的值1]
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    if (propKey === 'children') {
      if (typeof nextProp === 'string' || typeof nextProp === 'number') {
        if (nextProp !== lastProps[propKey]) {
          (updatePayload = updatePayload || []).push(propKey, nextProp);
        }
      }
    } else {
      // 新的属性和老的属性不一样
      if (nextProp !== lastProps[propKey]) {
        (updatePayload = updatePayload || []).push(propKey, nextProp);
      }
    }
  }
  return updatePayload;
}

export function updateProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === 'children') {
      domElement.textContent = propValue;
    } else {
      domElement.setAttribute(propKey, propValue);
    }
  }
}
