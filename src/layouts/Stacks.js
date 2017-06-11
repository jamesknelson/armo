import React from 'react'


/**
 * A layout that fills the entire remaining space by fixing the height of the
 * first elements, and giving the remaining height to the final element.
 *
 * If the final element contains content that takes more height than the this
 * element's parent, it will overflow.
 */
export function VerticalStack({ style, className, children }) {
  const items = React.Children.toArray(children)
  const head = items.slice(0, items.length - 1)
  const tail = items[items.length - 1]

  const mergedStyle = Object.assign({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }, style)

  return (
    <div style={mergedStyle} className={className}>
      {head.map(el => React.cloneElement(el, {
        style: {
          position: 'relative',
          flexGrow: 0,
          flexShrink: 0,
        }
      }))}
      {React.cloneElement(tail, {
        style: {
          position: 'relative',
          flexGrow: 1,
          flexShrink: 1,
        }
      })}
    </div>
  )
}


export function HorizontalStack({ style, className, children }) {
  const items = React.Children.toArray(children)
  const head = items.slice(0, items.length - 1)
  const tail = items[items.length - 1]

  const mergedStyle = Object.assign({
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  }, style)

  return (
    <div style={mergedStyle} className={className}>
      {head.map(el => React.cloneElement(el, {
        style: {
          position: 'relative',
          flexGrow: 0,
          flexShrink: 0,
        }
      }))}
      {React.cloneElement(tail, {
        style: {
          position: 'relative',
          flexGrow: 1,
          flexShrink: 1,
        }
      })}
    </div>
  )
}
