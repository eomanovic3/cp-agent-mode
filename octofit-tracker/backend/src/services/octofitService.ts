import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function createValidationError(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function ensureValidObjectId(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw createValidationError(`Invalid ${fieldName} id`);
  }
  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw createValidationError('Activity payload is required');
  }

  const payload = input as Record<string, unknown>;
  const userId = ensureValidObjectId(payload.userId, 'user');
  const teamId = ensureValidObjectId(payload.teamId, 'team');
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutesValue = Number(payload.minutes);

  if (!type) throw createValidationError('Activity type is required');
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) throw createValidationError('Activity minutes must be a positive number');

  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const team = await Team.findById(teamId);
  if (!team) throw Object.assign(new Error('Team not found'), { status: 404 });

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: minutesValue,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw createValidationError('Team payload is required');
  }

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];

  if (!name) throw createValidationError('Team name is required');
  if (!mascot) throw createValidationError('Team mascot is required');

  const members = rawMembers.map((member) => {
    if (typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member)) {
      throw createValidationError('Team members must be valid user ids');
    }
    return new mongoose.Types.ObjectId(member);
  });

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = decodeURIComponent(userEmail).trim();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentFocuses = recentActivities
    .map((activity) => String(activity.type).toLowerCase())
    .filter(Boolean);
  const goal = String(user.fitnessGoal ?? '').toLowerCase();

  const suggestions = await Workout.find().lean();

  const scoredSuggestions = suggestions
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      let score = 0;
      if (focus === goal) score += 3;
      if (recentFocuses.some((activityType) => focus === activityType || activityType.includes(focus) || focus.includes(activityType))) score += 2;
      if (focus === 'endurance' && goal === 'endurance') score += 1;
      if (focus === 'strength' && goal === 'strength') score += 1;

      const reasonParts = [] as string[];
      if (focus === goal) reasonParts.push(`matches your ${goal} goal`);
      if (recentFocuses.includes(focus)) reasonParts.push(`aligns with your recent ${focus} activity`);
      if (recentFocuses.length && !reasonParts.length) reasonParts.push(`supports your recent activity pattern`);

      return {
        ...workout,
        score,
        reason: reasonParts.length ? reasonParts.join(' and ') : 'Builds balanced fitness habits',
      };
    })
    .sort((a, b) => b.score - a.score || String(a.title ?? '').localeCompare(String(b.title ?? '')));

  return scoredSuggestions.slice(0, 3).map(({ _id, title, focus, minutes, difficulty, reason }) => ({
    _id,
    title,
    focus,
    minutes,
    difficulty,
    reason,
  }));
}

export { User };
