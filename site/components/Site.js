import './Site.less'
import React from 'react'
import { Link } from 'sitepack-react'

export function SiteBar(props) {
  return <h1 {...props}><Link page='/site/content/index.page.js'>Seven Stripes Armo</Link></h1>
}
