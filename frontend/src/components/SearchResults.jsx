import styled from 'styled-components'

const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  word-wrap: break-word;
  background: transparent;
  border: 2px dashed #f5f5f5;
  margin-right: 2rem;
  color: rgba(255, 255, 255, 0.9);

  @media (max-width: 768px) {
    margin-right: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem;
  }

  @media (prefers-color-scheme: light) {
    border-color: #e8e8e8;
    color: rgba(255, 255, 255, 0.95);
  }
`

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(184, 134, 11, 0.3);
`

const SearchIcon = styled.span`
  margin-right: 0.5rem;
  font-size: 1.1em;
`

const SearchTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #daa520;
  font-weight: 600;
`

const SearchQuery = styled.span`
  font-style: italic;
  opacity: 0.8;
  margin-left: 0.5rem;
`

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ResultItem = styled.div`
  padding: 0.5rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #b8860b;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-left-color: #daa520;
  }
`

const ResultTitle = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
`

const ResultUrl = styled.a`
  color: #b8860b;
  text-decoration: none;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  display: block;
  opacity: 0.8;

  &:hover {
    color: #daa520;
    text-decoration: underline;
  }
`

const ResultSnippet = styled.p`
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
`

const ResultSource = styled.span`
  font-size: 0.7rem;
  color: #8b7355;
  font-style: italic;
  margin-top: 0.25rem;
  display: block;
`

const NoResults = styled.div`
  text-align: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
`

function SearchResults({ query, results, count }) {
  if (!results || results.length === 0) {
    return (
      <SearchContainer>
        <SearchHeader>
          <SearchIcon>🔍</SearchIcon>
          <SearchTitle>
            Search Results
            <SearchQuery>"{query}"</SearchQuery>
          </SearchTitle>
        </SearchHeader>
        <NoResults>No results found for this search.</NoResults>
      </SearchContainer>
    )
  }

  return (
    <SearchContainer>
      <SearchHeader>
        <SearchIcon>🔍</SearchIcon>
        <SearchTitle>
          Search Results ({count})
          <SearchQuery>"{query}"</SearchQuery>
        </SearchTitle>
      </SearchHeader>
      
      <ResultsList>
        {results.map((result, index) => (
          <ResultItem key={index}>
            <ResultTitle>{result.title}</ResultTitle>
            {result.url && (
              <ResultUrl 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {result.url}
              </ResultUrl>
            )}
            {result.snippet && (
              <ResultSnippet>{result.snippet}</ResultSnippet>
            )}
            {result.source && (
              <ResultSource>Source: {result.source}</ResultSource>
            )}
          </ResultItem>
        ))}
      </ResultsList>
    </SearchContainer>
  )
}

export default SearchResults