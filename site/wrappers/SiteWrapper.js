import PropTypes from 'prop-types'
import React from 'react'

import { VerticalStack } from 'layouts/Stacks'
import { SiteBar } from '../components/Site'


SiteWrapper.propTypes = {
  page: PropTypes.object.isRequired,
  children: PropTypes.node,
}
export default function SiteWrapper({ site, page, children }) {
  return (
    <VerticalStack>
      <SiteBar />
      {
        /* `children` will be `undefined` on 404 */
        children || <div className='404'>404</div>
      }
    </VerticalStack>
  )
}
