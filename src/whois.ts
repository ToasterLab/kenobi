import Whoiser from 'whoiser'
import { parseDomain, ParseResultType } from 'parse-domain'
import Memoize from './memoize'

export type WhoisResult = { [key: string]: { [prop: string]: string } }

const supplementaryKnownDomains = new Set([
  `ift.tt`,
  `es.pn`,
  `apt.int`,
  `wrd.cm`,
  `itu.int`,
  `trib.al`,
])

const lookupHostname = Memoize(async (hostname: string) => await Whoiser(hostname))

const checkIfInvalid = (result: {[prop: string]: string}) => {
  const { text } = result
  return (
    new RegExp(/not found/, `i`).test(text) &&
    !(`Expiry Date` in result)
  )
}

const getDomainFromURL = (url: string): string => {
  const { hostname } = new URL(url.toLowerCase())
  const parsedHostname = parseDomain(hostname)
  if(parsedHostname.type === ParseResultType.Listed){
    const { domain, topLevelDomains } = parsedHostname
    return [domain, ...topLevelDomains].join(`.`)
  }
  return hostname
}

const isDomainInvalid = async (url: string): Promise<[boolean, WhoisResult]> => {
  const domain = getDomainFromURL(url)
  if(supplementaryKnownDomains.has(domain)){
    return [false, {}]
  }
  try {
    const whoisResult: WhoisResult = (await lookupHostname(domain))
    return [
      Object.values(whoisResult).some(result => checkIfInvalid(result)),
      whoisResult
    ]
  } catch {
    console.log(`Unrecognised URL:`, url, domain)
    return [
      true,
      {
        unknown: {
          domain,
          url
        }
      }
    ]
  }
}

const Whois = {
  getDomainFromURL,
  isDomainInvalid,
  lookupHostname,
}

export default Whois