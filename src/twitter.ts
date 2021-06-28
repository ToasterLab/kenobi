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
  if(!TWITTER_BEARER_TOKEN || TWITTER_BEARER_TOKEN.length === 0){
    throw new Error(`Please set a TWITTER_BEARER_TOKEN environment variable`)
  }
  return new TwitterV2({
    bearer_token: TWITTER_BEARER_TOKEN,
  })
}

const getTweets = Memoize(
  async (id: string, paginationToken = null):
  Promise<{ data: Tweet[], meta: { next_token: string }}> => {
    const client = await getClient()
    const { data, errors, meta } = await client.get(`users/${id}/tweets`, {
      max_results: `100`,
      tweet: {
        fields: [
          `created_at`,
          `entities`,
        ],
      },
      ...(paginationToken
        ? { pagination_token: paginationToken }
        : {}
      )
    })
    if(errors){
      throw errors
    }
    return { data, meta }
  }
)

const getAllTweets = async (
  id: string,
  lastData = [],
  paginationToken = null,
): Promise<Tweet[]> => {
  const { data, meta } = await getTweets(id, paginationToken)
  const totalData: Tweet[] = [...lastData, ...data]
  if(meta?.next_token){
    return await getAllTweets(id, totalData, meta.next_token)
  }
  return totalData
}

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
  const userId = await userLookup(handle)
  return await getAllTweets(userId)
}

const Twitter = {
  getAllTweets,
  getTweets,
  getTweetsByUsername,
  userLookup,
}

export default Twitter