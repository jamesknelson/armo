import React from 'react'
import elemap from 'react-elemap'
import hoistStatics from './hoistStatics'


function prefixClassName(prefix, el) {
  const className = el.props.className
  if (!className) return el

  return React.cloneElement(el, {
    className: className
      .trim()
      .split(/\s+/g)
      .map(className => prefix+'-'+className)
      .join(' ')
  })
}

function transformRoot(el, prefix, props) {
  return React.cloneElement(el, {
    className: [prefix, el.props.className || '', props.className || ''].join(' '),
    style: el.props.style || props.style,
  })
}


export default function createPrefixer(...names) {
  const prefix = 'RA_'+names.join('_')
  function prefixComponent(component, forcedName) {
    const name = forcedName || component.displayName || component.name
    let componentPrefix = prefix
    if (names[names.length - 1] !== name) {
      componentPrefix += '_'+name
    }
    const prefixer = prefixClassName.bind(null, componentPrefix)

    let decoratedComponent
    if (component.prototype instanceof React.Component) {
      decoratedComponent = class DecoratedComponent extends component {
        render() {
          return transformRoot(elemap(super.render(), prefixer), componentPrefix, this.props)
        }
      }
    }
    else {
      decoratedComponent = (props, context) =>
        transformRoot(elemap(component(props, context), prefixer), componentPrefix, props)
    }

    hoistStatics(component, decoratedComponent)
    decoratedComponent.displayName = name
    return decoratedComponent
  }

  prefixComponent.withName = forcedName => component => prefixComponent(component, forcedName)
  prefixComponent.element = (element, elementPrefix) => {
    const fullPrefix = prefix+'_'+elementPrefix
    return transformRoot(elemap(element, prefixClassName.bind(null, fullPrefix)), fullPrefix, {})
  }

  return prefixComponent
}