import fs from 'fs'
import React, { useEffect, useState} from 'react'
import { Text, Box } from 'ink'
import Twitter from '../twitter'
import Whois, { WhoisResult } from '../whois'
import type { Tweet } from '../types/Twitter'

interface Properties {
  handle: string
}

type Result = Tweet & { invalidURL: { url: string, whois: WhoisResult } }

// eslint-disable-next-line sonarjs/cognitive-complexity
const Main: React.FC<Properties> = ({ handle }) => {
  const [isFetching, setIsFetching] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [tweets, setTweets] = useState([] as Tweet[])
  const [currentPos, setCurrentPos] = useState(0)
  const [results, setResults] = useState([] as Result[])

  useEffect(() => {
    (async () => {
      setIsFetching(true)
      try {
        const tweets = await Twitter.getTweetsByUsername(handle)
        setTweets(tweets)
        for(const [index, tweet] of tweets.entries()){
          setCurrentPos(index)
          if(!(`entities` in tweet) || !(`urls` in tweet.entities)){
            continue
          }
          const { entities: { urls } } = tweet
          for(const url of urls){
            const { expanded_url } = url
            const [isInvalid, result] = await Whois.isDomainInvalid(expanded_url)
            if(isInvalid){
              setResults([
                ...results,
                {
                  ...tweet,
                  invalidURL: {
                    url: expanded_url,
                    whois: result
                  }
                }
              ])
            }
          }
        }
      } catch (error){
        console.error(error)
      }
      setIsDone(true)
    })()
  }, [])

  useEffect(() => {
    if(results.length > 0){
      fs.writeFileSync(
        `${handle}.json`,
        JSON.stringify(results, undefined, 2)
      )
    }
  }, [isDone])

  if(isDone){
    return (
      <Text>
        {results.length} result{results.length === 1 ? `` : `s`}.
        {results.length > 0 ? ` Exported to ${handle}.json` : ``}
      </Text>
    )
  }

  if(isFetching){
    return (
      <>
        <Text color="green">
          {`${(((currentPos + 1)/tweets.length)*100).toFixed(2)} `}
          {`${currentPos + 1} of ${tweets.length}`}
        </Text>
        {
          results.length > 0 ? (
            <>
              <Text>Results:</Text>
              {results.map((result: Result) => (
                <Box padding={1} key={result.id} flexDirection="column">
                  <Text>{result.text}</Text>
                  <Text color="red">{result.invalidURL.url}</Text>
                  <Text color="blue">{`https://twitter.com/${handle}/status/${result.id}`}</Text>
                </Box>
              ))}
            </>
          ) : null
        }
      </>
    )
  }

  return <Text>🔎 Fetching {handle}'s tweets</Text>
}

export default Main