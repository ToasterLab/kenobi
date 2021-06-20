import React from 'react'
import { render } from 'ink'
import { program } from 'commander'
import Main from './components/main'
import packageJson from '../package.json'

const checkTweets = (handle: string) => {
  render(<Main handle={handle} />)
}

program
  .version(packageJson.version)
  .name(packageJson.name)
  .arguments(`<handle>`)
  .description(`check for broken links in <handle>'s tweets`, {
    handle: `Twitter handle of user whose tweets should be checked`
  })
  .action(checkTweets)

program.parse(process.argv)