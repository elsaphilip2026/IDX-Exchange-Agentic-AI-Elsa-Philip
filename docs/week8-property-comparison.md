
# Week 8 — Conversational Property Comparison

## Objective

Extend the IDX Exchange Agentic AI chatbot to compare two active real-estate listings from a user's previous property search.

Reuse existing conversational session memory without performing another MySQL query for the comparison.

## Architecture

User searches for properties
        |
        v
Conversational search handler
        |
        v
MySQL active listing search
        |
        v
Store listings in session memory
        |
        v
User requests property comparison
        |
        v
Detect comparison intent
        |
        v
Retrieve lastResults from session
        |
        v
Select properties by result position
        |
        v
Generate structured comparison
        |
        v
Return chatbot response

## Implementation Files

- src/property-comparison.ts
- src/chat-server.ts
- src/session-memory.ts
- src/conversational-search.ts
- src/listing-search.ts

## Implemented Features

### 1. Comparison Intent Detection

The chatbot recognizes requests such as:

- Compare property 1 and property 3
- Compare 2 and 4
- Compare listing 1 vs listing 5

The comparison handler executes before regular conversational property search processing.

### 2. Session Memory Integration

The existing conversational search module stores retrieved listings using:

updateSession(userId, {
  lastResults: listings,
});

The comparison handler retrieves those listings using getSession(sessionId).

### 3. Property Comparison Fields

The comparison response includes:

- Property address
- Listing price
- Bedrooms
- Bathrooms
- Square footage
- Days on Market (DOM)
- Cumulative Days on Market (CDOM)
- HOA fee and frequency

### 4. Invalid Selection Handling

If a requested property number does not exist in the latest search results, the chatbot returns a helpful error message.

## Testing

TypeScript compilation: Passed

Property search: Passed

Test search:
Find homes in Pasadena under $1.5 million with at least 3 bedrooms.

Results returned: 5 active properties.

Comparison request:
Compare property 1 and property 3.

Property 1:
- Address: 965 E Del Mar Boulevard 4, Pasadena
- Price: $679,000
- Bedrooms: 3
- Bathrooms: 2
- Square footage: 890
- DOM: 24
- CDOM: 24
- HOA: $312 Monthly

Property 3:
- Address: 64 N Mar Vista Avenue 127, Pasadena
- Price: $729,000
- Bedrooms: 3
- Bathrooms: 3
- Square footage: 1,220
- DOM: 66
- CDOM: 66
- HOA: $464 Monthly

Comparison output: Passed

Invalid property selection test:
Compare property 1 and property 9.

Expected error message returned: Passed

## Current Limitations

1. Comparisons are limited to the latest stored regular search results.
2. The current implementation compares two properties at a time.
3. Properties are selected using their position in the search results.
4. Session memory is stored in-process and is not persistent across server restarts.
5. Descriptive semantic-search results are not currently saved into the same lastResults field.
6. Natural-language follow-up questions are not yet supported.
7. HOA fees are displayed with their original frequency and are not normalized across billing periods.
8. The current comparison is descriptive and does not determine market value.

## Future Improvements

- Support questions such as "Which property is cheaper?"
- Calculate price and square-footage differences.
- Compare HOA costs across different billing frequencies.
- Support comparison by MLS listing ID or address.
- Allow comparisons involving more than two properties.
- Add automated property comparison tests.
- Improve session persistence.

## GitHub

Feature commit:
d208ee3

Commit message:
Add conversational property comparison feature

Branch:
main
