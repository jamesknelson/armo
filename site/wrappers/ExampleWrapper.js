import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Link, PageContentLoader } from 'sitepack-react'


export default class SiteWrapper extends Component {
  static propTypes = {
    page: PropTypes.object.isRequired,
    children: PropTypes.node,
  }

  renderPageContent = ({ page, errorMessage, isLoading, content }) => {
    return (
      <div>
        {content && content.default && React.createElement(content.default)/* content
          ? <div className='BreadboardWrapper-content'>
              <BreadboardLoader
                require={this.props.page.breadboardRequire}
                pageId={this.props.page.id}
                type='raw'
                defaultSource={content}
                defaultMode='source'
                defaultSecondary='view'
              />
            </div>
          : <PageLoadIndicator busy={isLoading} error={errorMessage} />
        */}
      </div>
    )
  }

  render() {
    const { site, page, children } = this.props

    return (
        <PageContentLoader
          page={page}
          render={this.renderPageContent}
        />
      )
  }
}


// import './RawBreadboardWrapper.less'
// import ExecutionEnvironment from 'exenv'
// import React, { Component, PropTypes } from 'react'
// import ReactDOMServer from 'react-dom/server'

// import getCodeBlockOptions from 'utils/getCodeBlockOptions'
// import { PageLoadIndicator } from 'components/views/StatusIndicators'


// function importBreadboard() {
//   return Promise.all([
//     import('armo-breadboard'),
//     import('../components/fullscreenBreadboardTheme'),
//   ]).then(([
//     { RawBreadboard },
//     { default: fullscreenBreadboardTheme },
//   ]) => ({
//     RawBreadboard,
//     fullscreenBreadboardTheme,
//   }))
// }


// export default (
//   ExecutionEnvironment.canUseDOM
//     ? Promise.resolve()
//     : importBreadboard()
// ).then(breadboardModules => {
//   class BreadboardLoader extends Component {
//     static propTypes = {
//       pageId: PropTypes.string.isRequired,
//       type: PropTypes.oneOf(['component', 'raw']).isRequired,
//     }

//     constructor(props) {
//       super(props)

//       this.breadboardId = 1
//       this.breadboardDOMId = 'breadboard-loader-'+props.pageId.replace(/[^\w-]/g, '_')+'-'+this.breadboardId

//       if (ExecutionEnvironment.canUseDOM) {
//         const el = document.getElementById(this.breadboardDOMId)

//         this.state = {
//           string: el ? el.innerHTML : ''
//         }
//       }
//       else {
//         this.state = {
//           breadboardModules,
//           string: ReactDOMServer.renderToStaticMarkup(this.renderBreadboard(breadboardModules))
//         }
//       }
//     }

//     componentDidMount() {
//       importBreadboard().then(breadboardModules => this.setState({ breadboardModules }))
//     }

//     renderBreadboard(breadboardModules) {
//       const { type, pageId, ...options } = this.props

//       let component
//       if (type === 'raw') component = breadboardModules.RawBreadboard
//       if (type === 'component') component = breadboardModules.ComponentBreadboard

//       return React.createElement(component, {
//         theme: breadboardModules.fullscreenBreadboardTheme,
//         ...options
//       })
//     }

//     render() {
//       const state = this.state

//       if (state.breadboardModules) {
//         return <div ref='loader' className='BreadboardLoader' id={this.breadboardDOMId}>{this.renderBreadboard(state.breadboardModules)}</div>
//       }
//       else if (state.string) {
//         return <div ref='loader' className='BreadboardLoader' id={this.breadboardDOMId} dangerouslySetInnerHTML={{ __html: state.string }} />
//       }
//       else {
//         return <div ref='loader' className='BreadboardLoader' id={this.breadboardDOMId}>Loading Code Examples...</div>
//       }
//     }
//   }

//   return class RawBreadboardWrapper extends Component {
//     static propTypes = {
//       page: PropTypes.object.isRequired,
//     }

//     renderPageContent = ({ page, errorMessage, isLoading, content }) =>
//       <div>
//         { content
//           ? <div className='BreadboardWrapper-content'>
//               <BreadboardLoader
//                 require={this.props.page.breadboardRequire}
//                 pageId={this.props.page.id}
//                 type='raw'
//                 defaultSource={content}
//                 defaultMode='source'
//                 defaultSecondary='view'
//               />
//             </div>
//           : <PageLoadIndicator busy={isLoading} error={errorMessage} />
//         }
//       </div>

//     render() {
//       const { page, hash } = this.props

//       /**
//        * A Sitepack Page will not always have its content available immediately.
//        *
//        * In order to reduce the bundle size of your application, Sitepack will
//        * sometimes replace the `content` property of a Page object with a
//        * function that returns a Promise to your content.
//        *
//        * While it is possible to handle these promises yourself, the
//        * <PageContentLoader /> element from the `sitepack-react` package is the
//        * recommended way of accessing your Page content in a React app.
//        */
//       return (
//         <PageContentLoader
//           page={page}
//           render={this.renderPageContent}
//         />
//       )
//     }
//   }
// })
