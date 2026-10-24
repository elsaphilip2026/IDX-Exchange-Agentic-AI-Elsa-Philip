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
