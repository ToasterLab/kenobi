import fs from 'fs'
import React, { useCallback, useEffect, useState} from 'react'
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
  const [isDone, setIsDone] = useState(false)
  const [tweets, setTweets] = useState([] as Tweet[])
  const [currentPos, setCurrentPos] = useState(0)
  const [results, setResults] = useState([] as Result[])
  const [doneFetchingTweets, setIsDoneFetchingTweets] = useState(false)

  const getTweets = useCallback(async (userID, nextToken = null) => {
    const { data, meta } = await Twitter.getTweets(userID, nextToken)
    const tweetsWithURLs = data.filter((t: Tweet) => t?.entities?.urls)
    setTweets(existingTweets => [...existingTweets, ...tweetsWithURLs])
    if(meta?.next_token){
      await getTweets(userID, meta.next_token)
      return
    }
    setIsDoneFetchingTweets(true)
  }, [tweets])

  useEffect(() => {
    (async () => {
      const userID = await Twitter.userLookup(handle)
      getTweets(userID)
    })()
  }, [])

  useEffect(() => {
    if(!doneFetchingTweets){
      return
    }
    (async () => {
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
            setResults(existingResults => [
              ...existingResults,
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
      setIsDone(true)
    })()
  }, [doneFetchingTweets])

  useEffect(() => {
    fs.writeFileSync(
      `${handle}.json`,
      JSON.stringify(
        {
          allDomains: [...new Set(tweets.reduce((accumulator, tweet) => {
              if(tweet?.entities?.urls){
                return [
                  ...accumulator,
                  ...tweet.entities.urls.map(
                    ({ expanded_url }) => Whois.getDomainFromURL(expanded_url)
                  )
                ]
              }
              return accumulator
            }, [])
          )],
          results
        },
        undefined,
        2
      )
    )
  }, [isDone])

  if(isDone){
    return (
      <Text>
        {results.length} result{results.length === 1 ? `` : `s`}.
        Exported to {handle}.json
      </Text>
    )
  }

  if(doneFetchingTweets){
    return (
      <>
        <Text color="green">
          Checking URLs in tweets:&nbsp;
          {`${(((currentPos + 1)/tweets.length)*100).toFixed(2)}% `}
          {`${currentPos + 1} of ${tweets.length}`}
        </Text>
        {
          results.length > 0 ? (
            <>
              <Text>Results:</Text>
              {results.map((result: Result, index) => (
                <Box padding={1} key={`${result.id}-${index}`} flexDirection="column">
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

  return (
    <>
      <Text>🔎 Fetching {handle}'s tweets with URLs... This may take awhile</Text>
      <Text>Fetched {tweets.length} so far</Text>
    </>
  )
}

export default Main