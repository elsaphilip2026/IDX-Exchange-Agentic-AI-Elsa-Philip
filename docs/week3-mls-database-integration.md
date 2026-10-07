# Week 3 – MLS Database Integration

## Goal

Connect OpenClaw to the MLS databases using a safe, parameterized query layer with pagination and formatted property results.

## Database Connection

Created `src/mysql.ts` using `mysql2/promise`.

The module:

- Creates a MySQL connection pool
- Uses environment variables for database credentials
- Uses `pool.execute()` for parameterized SQL queries
- Does not store database credentials in the GitHub repository

Environment variables:

- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Database credentials are stored locally and are excluded from GitHub.

## Active Listing Search

Created `src/listing-search.ts`.

The module queries the `rets_property` table and supports:

- City
- Minimum price
- Maximum price
- Bedrooms
- Bathrooms
- Minimum square footage
- Property type
- Private pool
- View

Only filters supplied by the user are added to the SQL query.

SQL parameters use placeholders (`?`) instead of inserting user text directly into SQL.

Results are ordered by price and support pagination using `LIMIT` and `OFFSET`.

## Sold Comparable Properties

Created `src/sold-comps.ts`.

The module queries:

`california_sold.california_sold`

Sold comparable searches support:

- City
- Closing date range
- Residential property type
- Newest sales first
- Maximum of 50 results

The default comparison period is 12 months.

## Property Result Formatting

Created `src/property-formatter.ts`.

Raw MLS rows are converted into readable property cards containing information such as:

- Address
- Price
- Bedrooms
- Bathrooms
- Square footage
- Property type
- Pool
- View
- Listing status
- MLS listing ID

Sold-property cards include sold price, close date, list price, and days on market.

## MLS Flag Handling

Testing the real MLS data showed that `PoolPrivateYN` and `ViewYN` use `1` for enabled values.

The active-listing query layer converts pool and view requests to the MLS value `1`.

This was verified using a live query requesting Beverly Hills properties with a pool.

## OpenClaw Skill

Created:

`skills/mls-property-search/SKILL.md`

The skill connects the Week 2 natural-language parser with the Week 3 database query layer.

Workflow:

Natural-language property request
→ Property search parser
→ Structured filters
→ Parameterized MLS query
→ Property formatter
→ Property cards

The skill was validated successfully and reports as Ready in OpenClaw.

## Verification

Database connectivity was verified from WSL to MySQL.

The following components were tested successfully:

1. MySQL connection
2. Active listing search
3. Sold comparable search
4. Natural-language parser to MLS query
5. Property-card formatting
6. OpenClaw skill execution
7. Pool filtering against real MLS values

### End-to-End Test

Test query:

`Find me a 3 bedroom house in Beverly Hills under $5m.`

OpenClaw successfully returned active MLS property cards from the `rets_property` database.

A second test included:

`Find me a 3 bedroom house in Beverly Hills under $5m with a pool.`

OpenClaw successfully returned matching active properties with `Pool: Yes`.

## Week 3 Deliverable

The Week 3 OpenClaw skill now:

- Accepts natural-language property requests
- Uses structured filters from the Week 2 parser
- Queries `rets_property`
- Queries `california_sold`
- Uses parameterized SQL
- Supports pagination for active listings
- Formats database results into readable property cards
- Returns verified MLS data through OpenClaw
