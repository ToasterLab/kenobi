export interface URL {
  expanded_url?: string,
  status?: number
}

export interface Tweet {
  text: string,
  public_metrics: {
    retweet_count: number,
    reply_count: number,
    like_count: number,
    quote_count: number,
  },
  id: string,
  created_at: string,
  entities?: {
    urls?: URL[]
  }
}