import React from 'react'
import { Link } from 'sitepack-react'


export default function IndexPage({ page }) {
  return (
    <div>
      <h2>Examples</h2>
      <ul>
        {page.children.map(page =>
          <li key={page.id}>
            <Link page={page.id}>{page.title}</Link>
          </li>
        )}
      </ul>
    </div>
  )
}