// TODO: add comment-based front matter

const url = require('url')
const path = require('path')
const loaderUtils = require('loader-utils')
const { loadPageWithContent } = require('sitepack/lib/loaderUtils')


export default function componentPageLoader(content) {
  const loaderOptions = loaderUtils.getOptions(this) || {};
  return loadPageWithContent(this, loaderOptions, {}, content)
}
