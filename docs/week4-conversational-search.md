# Week 4 – Conversational Property Search and Session Memory

## Goal

Extend the MLS property search into a multi-turn conversational experience so users can refine a property search across multiple messages without repeating previously supplied criteria.

## Session Memory

Created `src/session-memory.ts`.

The module maintains a session for each user using a unique `userId`.

The session stores:

- Property search filters
- Last MLS results
- Conversation step

Supported remembered filters include:

- City
- Minimum price
- Maximum price
- Bedrooms
- Bathrooms
- Minimum square footage
- Property type
- Pool
- View
- Maximum HOA

Users can also reset the current search using commands such as:

- `reset`
- `start over`
- `new search`
- `clear`

## Conversational Search

Created `src/conversational-search.ts`.

Each new user message is parsed independently using the Week 2 property-search parser.

Newly detected filters are merged with the filters already stored in the user's session.

Example:

User:

`Find homes in Irvine`

Remembered:

`City: Irvine`

User:

`Under $1.2M`

Remembered:

`City: Irvine | Max price: $1,200,000`

User:

`At least 3 bedrooms`

Remembered:

`City: Irvine | Max price: $1,200,000 | Bedrooms: 3+`

This allows users to refine their search naturally without repeating the complete request.

## MLS Database Integration

The conversational search is connected to the Week 3 MLS query layer.

Workflow:

Natural-language message
→ Property search parser
→ Session memory
→ Merged property filters
→ Parameterized MLS query
→ MLS results

The search uses `searchActiveListings()` from:

`src/listing-search.ts`

This ensures that conversational searches continue to use the safe parameterized SQL implementation created during Week 3.

## Interactive Property Chat

Created:

`src/interactive-property-chat.ts`

This provides an interactive terminal-based property chatbot for testing multi-turn searches.

The chatbot allows multiple messages to be entered within the same conversation while preserving the search criteria between turns.

## Chat Server

Created:

`src/chat-server.ts`

An Express-based API server provides a `/api/chat` endpoint for property-search requests.

The server provides a foundation for connecting the property-search pipeline to external chat interfaces.

Express and its TypeScript definitions were added to the project dependencies.

## OpenClaw MLS Skill

Updated:

`skills/mls-property-search/SKILL.md`

The skill now includes conversational search rules.

Important behavior includes:

- City is required before an MLS search
- Missing cities should not be guessed
- Follow-up messages preserve relevant search criteria
- New criteria refine the existing property search
- MLS property information must come from the database
- Missing property information must not be invented

## Verification

The Week 4 implementation was tested at multiple levels.

### Session Memory Test

Command:

`npx tsx src/test-session-memory.ts`

Verified:

1. New user session creation
2. City memory
3. Maximum-price refinement
4. Bedroom refinement
5. Session reset

### Conversational Search Test

Command:

`npx tsx src/test-conversational-search.ts`

Test conversation:

`Find homes in Irvine`

`Under $1.2M`

`At least 3 bedrooms`

`With a pool`

The session successfully retained previous criteria while adding each new filter.

### Conversational Database Test

Command:

`npx tsx src/test-conversational-db.ts`

Test conversation:

`Find homes in Irvine`

`Under $1.2M`

`At least 3 bedrooms`

The combined filters were successfully sent to the real MLS database.

Example results included:

1. 44 Fallbrook, Irvine — $735,000 — 3 beds — 2.0 baths — 1,084 sqft
2. 15 Brookfield, Irvine — $799,000 — 3 beds — 2.0 baths — 1,220 sqft
3. 11 Rosemary 20, Irvine — $829,888 — 3 beds — 2.0 baths — 1,123 sqft
4. 59 Fox Hollow, Irvine — $920,000 — 3 beds — 2.0 baths — 1,260 sqft
5. 2 Snapdragon, Irvine — $989,000 — 3 beds — 2.0 baths — 1,250 sqft

This verified the complete Week 4 pipeline:

Conversation
→ Parser
→ Session memory
→ Merged filters
→ MLS database
→ Matching property results

## Week 4 Deliverable

The Week 4 implementation now:

- Supports multi-turn property-search conversations
- Maintains search criteria across messages
- Allows users to refine price, bedrooms, pool, and other filters
- Supports resetting a property-search session
- Integrates conversational state with the real MLS database
- Preserves the Week 3 parameterized SQL query layer
- Provides an interactive terminal chatbot for testing
- Provides an Express chat API foundation
- Updates the OpenClaw MLS skill with conversational rules
- Successfully returns real MLS listings using remembered criteria

## Next Step

Connect the conversational property-search pipeline to the OpenClaw WhatsApp channel so users can perform the same multi-turn MLS search through WhatsApp.


---

## WhatsApp Integration and Final Improvements (November 2026)

### OpenClaw WhatsApp Integration

Completed the integration between the OpenClaw WhatsApp channel and the Express chat API.

The completed workflow is:

WhatsApp User
→ OpenClaw Agent
→ Express API (`/api/chat`)
→ Conversational Search
→ Session Memory
→ MySQL MLS Database
→ Formatted API Response
→ WhatsApp User

Users can search for properties and refine their criteria through consecutive WhatsApp messages.

### Property Details and Photo Counts

Updated the MLS search and response formatting to display:

- Property address and city
- Listing price
- Bedrooms and bathrooms
- Square footage
- Number of available property photos

Example:

44 Fallbrook, Irvine
$735,000
3 beds | 2 baths | 1084 sqft
Photos: 25

### Multi-Turn Search Validation

Tested the following WhatsApp conversation:

1. Find 3 bedroom homes in Irvine under $900k
2. Only show homes under $800k
3. Show me more properties

The initial search returned three properties. The second message retained the Irvine and three-bedroom filters while reducing the maximum price to $800,000.

The refined search returned:

- 44 Fallbrook, Irvine — $735,000 — 25 photos
- 15 Brookfield, Irvine — $799,000 — 33 photos

This confirmed that the chatbot retains relevant search criteria across multiple messages.

### Pagination and End-of-Results Handling

Implemented pagination support for follow-up requests such as:

`Show me more properties`

When the user reaches the final page, the chatbot responds:

> You've reached the end of the results. There are no more matching properties. Would you like to adjust your filters?

This replaces the earlier generic no-results response when no additional pages are available.

### Duplicate Property Response Fix

During WhatsApp testing, listings appeared twice because both the formatted API reply and structured property data could be displayed.

To resolve this:

- Updated `skills/mls-property-search/SKILL.md` to instruct OpenClaw to use the API-generated reply.
- Temporarily removed the `properties` field from the JSON response in `src/chat-server.ts`.

Subsequent WhatsApp tests returned property listings without duplication.

### Search Reset and Pool Filtering

Verified that users can reset their search using:

`Reset search`

Also tested follow-up filtering for homes with a pool. Search preferences were retained until the session was reset.

### Challenges Resolved

- Duplicate property listings in WhatsApp
- Missing photo counts in property responses
- Generic messages at the end of pagination
- TypeScript syntax errors introduced during API updates

### Final Outcome

Successfully demonstrated an end-to-end, multi-turn MLS property-search chatbot through WhatsApp.

The system supports natural-language property searches, session-based filter retention, MLS database queries, property detail formatting, photo counts, pagination, and search reset.

### GitHub Version

Repository:
https://github.com/elsaphilip2026/IDX-Exchange-Agentic-AI-Elsa-Philip

Week 4 WhatsApp improvements commit: `3746604`

### Future Improvements

- Persist conversation sessions across server restarts
- Improve natural-language parsing and clarification handling
- Add automated WhatsApp integration tests
- Support optional structured property responses for other client applications
