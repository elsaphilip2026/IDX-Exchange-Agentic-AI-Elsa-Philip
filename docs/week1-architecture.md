# Week 1 – OpenClaw Architecture Fundamentals

## Project Overview

The IDX Exchange Agentic AI project is an AI-powered real estate assistant built using OpenClaw. The system allows users to communicate using natural language through WhatsApp. OpenClaw interprets the request, selects the appropriate skill or tool, accesses MLS property data stored in MySQL when required, and returns a response to the user.

## System Architecture

The high-level workflow of the system is:

User → WhatsApp → OpenClaw Runtime → Skill Selector → Tool Execution → Memory Update → Response → User

## Architecture Workflow

```mermaid
flowchart TD
    A[User] --> B[WhatsApp]
    B --> C[OpenClaw Runtime]
    C --> D[Skill Selector]
    D --> E[Tool Execution]

    E --> F[(MySQL MLS Database)]
    E --> G[Other Tools / APIs]

    F --> E
    G --> E

    E --> H[Memory Update]
    H --> I[Response Generation]
    I --> B
    B --> A
