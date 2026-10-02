# Data model (site data sheet)

Owned by the wedding Gmail. Only Nadia, Griffin and Jehan have access. Delete guest data about
3 months after the wedding.

## Guests (one row per person, typed by us)

| Column | Example | Notes |
| --- | --- | --- |
| Household | Sam & Alex | How the household is greeted. Same value for everyone in it |
| Guest ID | g001 | Unique per person |
| First name | Sam | |
| Last name | | Optional |
| Email | | Used for the confirmation email |
| Phone | | Optional |
| Token | k7x2mq9p4r | Filled by the menu. Same for the whole household |
| Link | https://griffin-nadia.github.io/wedding/?h=k7x2mq9p4r | Filled by the menu |
| Attending | yes / no | Written by the site |
| Dietary | Vegetarian | Written by the site |

## RSVPs (one row per household, written by the site)

Token, Household, Arriving, Leaving, Message, Responded at

## Songs (one row per pick, written by the site)

Token, Household, Song, Added at

## Log (every submission, written by the site)

Time, Token, Payload (JSON)

## Content (v2)

Times, Q&A and travel tips can move here so Nadia can edit them without code. In v1 they live in
`src/content/en.ts`.
