import Whoiser from 'whoiser'
import Memoize from './memoize'

export type WhoisResult = { [key: string]: { [prop: string]: string } }

const lookupURL = Memoize(async (url: string) => {
  const { hostname } = new URL(url)
  return Whoiser(hostname.replace(/^www\./i, ``))
})

const checkIfInvalid = (result: {[prop: string]: string}) => {
  const { text } = result
  return (
    new RegExp(/not found/, `i`).test(text) &&
    !(`Expiry Date` in result)
  )
}

const isDomainInvalid = async (url: string): Promise<[boolean, WhoisResult]> => {
  const whoisResult: WhoisResult = (await lookupURL(url) as any)
  return [
    Object.values(whoisResult).some(result => checkIfInvalid(result)),
    whoisResult
  ]
}

const Whois = {
  isDomainInvalid,
  lookupURL,
}

export default Whois