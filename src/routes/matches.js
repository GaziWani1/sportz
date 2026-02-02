import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { matches } from "../db/schema.js";
export const matchRouter = Router();
import { db } from '../db/db.js';
import { getMatchStatus } from "../utils/match_status.js";
import { desc } from "drizzle-orm";

const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed) return res.status(400).json({
        error: "Invalid Query.", details: JSON.stringify(parsed.error)
    })

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT)

    try {
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit)
        return res.json({ data })
    } catch (error) {
        return res.status(500).json({
            error: "Internal Server Error.", details: JSON.stringify(error)
        })
    }
})

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed) return res.status(400).json({
        error: "Invalid payload.", details: JSON.stringify(parsed.error.issues)
    })

    const { data: { startTime, endTime, homeScore, awayScore } } = parsed;

    try {

        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime)
        }).returning();

        if (res.app.locals.broadCastMatchCreated) {
            res.app.locals.broadCastMatchCreated(event)
        }

        res.status(201).json({
            data: event
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: "Internal Server Error.", details: JSON.stringify(error)
        })
    }
})