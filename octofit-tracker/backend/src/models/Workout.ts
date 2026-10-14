import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: true, trim: true },
  focus: { type: String, required: true, trim: true },
  minutes: { type: Number, required: true, min: Number.MIN_VALUE },
  difficulty: { type: String, required: true, trim: true },
});

workoutSchema.index({ title: 1 }, { unique: true });

export const Workout = model('Workout', workoutSchema);
