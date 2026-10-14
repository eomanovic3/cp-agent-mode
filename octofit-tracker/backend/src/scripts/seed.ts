import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

const DEMO_TEAM_NAMES = { octocats: 'Octocats', robocats: 'Robocats' } as const;
const DEMO_USER_EMAILS = { mona: 'mona@example.com', hubot: 'hubot@example.com' } as const;
const DEMO_ACTIVITY_TYPES = { monaRun: 'run', hubotCycle: 'cycle' } as const;
const DEMO_WORKOUT_TITLES = { intervals: 'Intervals', strengthCircuit: 'Strength Circuit' } as const;

// Seed stable demo records without clearing data owned by the application.
async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await Team.findOneAndUpdate(
      { name: DEMO_TEAM_NAMES.octocats },
      { $set: { name: DEMO_TEAM_NAMES.octocats, mascot: 'Mona' } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    const robocats = await Team.findOneAndUpdate(
      { name: DEMO_TEAM_NAMES.robocats },
      { $set: { name: DEMO_TEAM_NAMES.robocats, mascot: 'Hubot' } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    const mona = await upsertDemoUser('Mona', DEMO_USER_EMAILS.mona, octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', DEMO_USER_EMAILS.hubot, robocats._id, 'strength');

    const monaRunAt = new Date('2026-01-10T12:00:00.000Z');
    const hubotCycleAt = new Date('2026-01-11T12:00:00.000Z');
    await Activity.updateOne(
      { user: mona._id, type: DEMO_ACTIVITY_TYPES.monaRun, occurredAt: monaRunAt },
      { $set: { user: mona._id, team: octocats._id, type: DEMO_ACTIVITY_TYPES.monaRun, minutes: 40, points: 40, occurredAt: monaRunAt } },
      { upsert: true, runValidators: true },
    );
    await Activity.updateOne(
      { user: hubot._id, type: DEMO_ACTIVITY_TYPES.hubotCycle, occurredAt: hubotCycleAt },
      { $set: { user: hubot._id, team: robocats._id, type: DEMO_ACTIVITY_TYPES.hubotCycle, minutes: 25, points: 25, occurredAt: hubotCycleAt } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { title: DEMO_WORKOUT_TITLES.intervals },
      { $set: { title: DEMO_WORKOUT_TITLES.intervals, focus: 'endurance', minutes: 30, difficulty: 'moderate' } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { title: DEMO_WORKOUT_TITLES.strengthCircuit },
      { $set: { title: DEMO_WORKOUT_TITLES.strengthCircuit, focus: 'strength', minutes: 30, difficulty: 'moderate' } },
      { upsert: true, runValidators: true },
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
