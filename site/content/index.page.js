export default {
  wrapper: 'SiteWrapper',
  title: "Armo",
  description: "Tools for building React applications.",
  content: require('./index.js'),
  children: [
    require('../../examples/Focus.example.js').set({
      title: 'Focus'
    }),
  ]
}
