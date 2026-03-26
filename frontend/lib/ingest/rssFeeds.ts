export type RssFeed = { name: string; url: string };

/**
 * UK-focused RSS / Atom sources — property, policy, business.
 * Feeds may change; failures are caught per-feed in the fetcher.
 */
export const RSS_FEEDS: RssFeed[] = [
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { name: "Guardian UK Business", url: "https://www.theguardian.com/uk/business/rss" },
  {
    name: "DLUHC (Gov.uk)",
    url: "https://www.gov.uk/government/organisations/department-for-levelling-up-housing-and-communities.atom",
  },
  {
    name: "Gov.uk — planning keyword",
    url: "https://www.gov.uk/search/news-and-communications.atom?keywords=planning+housing",
  },
  { name: "Reuters UK Business", url: "https://feeds.reuters.com/reuters/UKBusinessNews" },
  { name: "Independent Business", url: "https://www.independent.co.uk/news/business/rss" },
  { name: "City A.M.", url: "https://www.cityam.com/feed/" },
];
