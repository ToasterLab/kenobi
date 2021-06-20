import TwitterV2 from 'twitter-v2'
import type { Tweet } from './types/Twitter'
import Memoize from './memoize'

const dotEnvironmentConfig = async () => {
  if(process.env.NODE_ENV !== `production`){
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const dotEnvironment = await import(`dotenv`)
    dotEnvironment.config()
  }
}

const getClient = async (): Promise<TwitterV2> => {
  await dotEnvironmentConfig()
  const {
    TWITTER_BEARER_TOKEN
  } = process.env
  return new TwitterV2({
    bearer_token: TWITTER_BEARER_TOKEN,
  })
}

const getTweets = Memoize(async (
  id: string,
): Promise<Tweet[]> => {
  try {
    const client = await getClient()
    const { data, errors } = await client.get(`users/${id}/tweets`, {
      max_results: `100`,
      tweet: {
        fields: [
          `created_at`,
          `entities`,
          `public_metrics`,
        ],
      },
    })
    if(errors){
      throw errors
    }
    return data
  } catch (error){
    console.error(error)
  }
})

/**
 * @param handle Twitter handle
 * @returns twitter id
 */
const userLookup = Memoize(async (handle: string): Promise<string> => {
  const client = await getClient()
  try {
    const { data, errors } = await client.get(`users/by/username/${handle}`)
    if(errors){
      throw errors
    }
    const { id } = data
    return id
  } catch (error){
    console.error(error)
  }
})

const getTweetsByUsername = async (handle: string): Promise<Tweet[]> => {
  const userId = await Twitter.userLookup(handle)
  return await Twitter.getTweets(userId)
}

const Twitter = {
  getTweets,
  getTweetsByUsername,
  userLookup,
}

export default Twitter