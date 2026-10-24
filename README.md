# IDX Exchange Agentic AI

## Overview

This repository contains my Agentic AI internship project for IDX Exchange.

The project uses OpenClaw to build an AI-powered real estate assistant that can process natural-language property requests, interact with MLS data stored in MySQL, and communicate through messaging channels such as WhatsApp.

## Technology Stack

- OpenClaw
- MySQL
- TypeScript / JavaScript
- OpenAI
- WhatsApp
- WSL / Ubuntu
- Git & GitHub

## Project Progress

### Week 0 – Environment Setup
- OpenClaw installed and configured
- Local Gateway configured
- OpenAI model connected
- WhatsApp channel configured
- MySQL Server configured
- MLS SQL datasets imported into MySQL
- OpenClaw environment verified

### Week 1 – Architecture Fundamentals
- Architecture documentation
- OpenClaw workflow diagram
- Agent, skills, tools, memory, and channel design

### Week 2 – Natural Language Property Search
- Natural-language query parser
- Structured property filters
- MLS field mapping
- Test queries
### Week 3 – MLS Database Integration
- MySQL connection using `mysql2/promise`
- Parameterized MLS queries
- Active listing search using `rets_property`
- Sold comparable search using `california_sold`
- Pagination and property result formatting
- OpenClaw MLS property search skill
- [View Week 3 Documentation](docs/week3-mls-database-integration.md)

### Week 4 – Conversational Property Search & Session Memory
- Multi-turn conversational property search
- User session memory
- Search criteria retained across follow-up messages
- Price, bedroom, pool, and other filter refinements
- Session reset support
- Conversational search connected to the real MLS database
- Interactive terminal chatbot
- Express chat API foundation
- [View Week 4 Documentation](docs/week4-conversational-search.md)
## Data

The project uses MLS real estate datasets stored locally in MySQL.

Raw MLS data and database dump files are not included in this repository.

## Security

Credentials, API keys, database passwords, environment variables, and raw MLS data are excluded from version control.
