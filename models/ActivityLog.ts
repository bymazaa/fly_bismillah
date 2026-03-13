// models/ActivityLog.ts

import { Schema, model, models, Model, Document } from 'mongoose';
import { IActivityLog } from '@/types/admin';

export type ActivityLogDocument = IActivityLog & Document;

const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Admin reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
    },
    target: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    targetModel: {
      type: String,
      default: 'Admin',
    },
    details: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ admin: 1, createdAt: -1 });
ActivityLogSchema.index({ target: 1 });
ActivityLogSchema.index({ action: 1 });

const ActivityLog: Model<ActivityLogDocument> =
  models.ActivityLog ||
  model<ActivityLogDocument>('ActivityLog', ActivityLogSchema);

export default ActivityLog;